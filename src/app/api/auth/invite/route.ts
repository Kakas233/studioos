import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import type { UserRole } from "@/lib/supabase/types";

const inviteSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().max(100).optional(),
  role: z.enum(["admin", "operator", "model", "accountant"]),
  cutPercentage: z.number().min(0).max(100).optional(),
  operatorCutPercentage: z.number().min(0).max(100).optional(),
  weeklyGoalHours: z.number().min(0).max(168).optional(),
  worksAlone: z.boolean().optional(),
});

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

    // Check model limit if inviting a model
    if (parsed.role === "model") {
      const { data: studio } = await admin
        .from("studios")
        .select("model_limit, current_model_count")
        .eq("id", inviter.studio_id)
        .single();

      if (studio && studio.current_model_count >= studio.model_limit) {
        return NextResponse.json(
          { error: "Model limit reached. Upgrade your plan to add more models." },
          { status: 403 }
        );
      }
    }

    // Create auth user with invite
    const { data: authData, error: authError } = await admin.auth.admin.inviteUserByEmail(
      parsed.email
    );

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "Failed to invite user" },
        { status: 400 }
      );
    }

    // Create account record
    const { error: accountError } = await admin.from("accounts").insert({
      auth_user_id: authData.user.id,
      studio_id: inviter.studio_id,
      email: parsed.email,
      first_name: parsed.firstName,
      last_name: parsed.lastName || null,
      role: parsed.role as UserRole,
      is_active: true,
      is_super_admin: false,
      works_alone: parsed.worksAlone ?? false,
      cut_percentage: parsed.cutPercentage ?? 50,
      operator_cut_percentage: parsed.operatorCutPercentage ?? 0,
      weekly_goal_hours: parsed.weeklyGoalHours ?? null,
      weekly_goal_enabled: !!parsed.weeklyGoalHours,
      payout_method: "cash",
      onboarding_dismissed: false,
      onboarding_completed_steps: [],
    });

    if (accountError) {
      await admin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    // Update model count if applicable
    if (parsed.role === "model") {
      await admin.rpc("increment_model_count", { p_studio_id: inviter.studio_id });
    }

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${parsed.email}`,
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
