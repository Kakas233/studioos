import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendInviteEmail } from "@/lib/email";
import { z } from "zod";
import type { UserRole } from "@/lib/supabase/types";

const inviteSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1).max(100),
  last_name: z.string().max(100).optional(),
  role: z.enum(["admin", "operator", "model", "accountant"]),
  password: z.string().min(8).optional(),
  cut_percentage: z.number().min(0).max(100).optional(),
  operator_cut_percentage: z.number().min(0).max(100).optional(),
  weekly_goal_hours: z.number().min(0).max(168).optional(),
  works_alone: z.boolean().optional(),
  payout_method: z.enum(["Bank", "Cash"]).optional(),
});

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars.charAt(b % chars.length)).join("");
}

// Role hierarchy for permission checking
const ROLE_LEVEL: Record<string, number> = {
  model: 0,
  accountant: 1,
  operator: 1,
  admin: 2,
  owner: 3,
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = inviteSchema.parse(body);

    const supabase = await createClient();

    // Verify the inviter is authenticated and authorized
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: inviter } = await supabase
      .from("accounts")
      .select("id, role, studio_id")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!inviter) {
      return NextResponse.json({ error: "Account not found" }, { status: 403 });
    }

    // Only admin/owner can invite
    if (!["admin", "owner"].includes(inviter.role)) {
      return NextResponse.json(
        { error: "Only admins and owners can invite users" },
        { status: 403 }
      );
    }

    // Prevent role escalation
    if (ROLE_LEVEL[parsed.role] >= ROLE_LEVEL[inviter.role]) {
      return NextResponse.json(
        { error: "Cannot invite users with equal or higher role" },
        { status: 403 }
      );
    }

    const admin = createAdminClient();

    // Check subscription status
    const { data: studioStatus } = await admin
      .from("studios")
      .select("subscription_status")
      .eq("id", inviter.studio_id)
      .single();
    if (studioStatus?.subscription_status === "suspended" || studioStatus?.subscription_status === "cancelled") {
      return NextResponse.json({ error: "Your subscription is not active. Please renew to continue." }, { status: 403 });
    }

    // Check if email already has an account in this studio
    const { data: existing } = await admin
      .from("accounts")
      .select("id")
      .eq("email", parsed.email)
      .eq("studio_id", inviter.studio_id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists in your studio" },
        { status: 409 }
      );
    }

    // Check model limit if inviting a model — increment atomically first
    if (parsed.role === "model") {
      // Increment first, then check if we exceeded the limit
      await admin.rpc("increment_model_count", { p_studio_id: inviter.studio_id });

      const { data: studio } = await admin
        .from("studios")
        .select("model_limit, current_model_count")
        .eq("id", inviter.studio_id)
        .single();

      if (studio && studio.current_model_count > studio.model_limit) {
        // Over limit — rollback the increment and reject
        await admin
          .from("studios")
          .update({ current_model_count: studio.current_model_count - 1 })
          .eq("id", inviter.studio_id);
        return NextResponse.json(
          { error: "Model limit reached. Upgrade your plan to add more models." },
          { status: 403 }
        );
      }
    }

    // Generate password for the invited user
    const password = parsed.password || generatePassword();

    // Create auth user with credentials
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: parsed.email,
      password,
      email_confirm: true, // Skip email verification for invited users
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "Failed to create user" },
        { status: 400 }
      );
    }

    // Get studio name for the email
    const { data: studioData } = await admin
      .from("studios")
      .select("name")
      .eq("id", inviter.studio_id)
      .single();

    const studioName = studioData?.name || "Your Studio";

    // Determine cut percentage defaults based on role
    const defaultCut = parsed.role === "accountant" ? 0 : 33;

    // Create account record
    const { error: accountError } = await admin.from("accounts").insert({
      auth_user_id: authData.user.id,
      studio_id: inviter.studio_id,
      email: parsed.email,
      first_name: parsed.first_name,
      last_name: parsed.last_name || null,
      role: parsed.role as UserRole,
      is_active: true,
      is_super_admin: false,
      works_alone: parsed.works_alone ?? false,
      cut_percentage: parsed.cut_percentage ?? defaultCut,
      operator_cut_percentage: parsed.operator_cut_percentage ?? 0,
      weekly_goal_hours: parsed.weekly_goal_hours ?? null,
      weekly_goal_enabled: !!parsed.weekly_goal_hours,
      payout_method: parsed.payout_method ?? "Bank",
      onboarding_dismissed: false,
      onboarding_completed_steps: [],
    });

    if (accountError) {
      await admin.auth.admin.deleteUser(authData.user.id);
      // Rollback model count if we incremented it
      if (parsed.role === "model") {
        const { data: s } = await admin.from("studios").select("current_model_count").eq("id", inviter.studio_id).single();
        if (s) await admin.from("studios").update({ current_model_count: Math.max(0, s.current_model_count - 1) }).eq("id", inviter.studio_id);
      }
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    // Send styled invite email with credentials
    const emailResult = await sendInviteEmail(
      parsed.email,
      password,
      parsed.role,
      studioName
    );

    if (!emailResult.success) {
      console.error("Invite email failed:", emailResult.error);
      // Account was created but email failed — return the password so admin can share it manually
      return NextResponse.json({
        success: true,
        email_failed: true,
        temporary_password: password,
        message: `${parsed.first_name} was added but the invite email could not be sent. Please share these credentials manually.`,
      });
    }

    return NextResponse.json({
      success: true,
      message: `${parsed.first_name} has been invited to ${studioName}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Invite error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
