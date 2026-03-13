import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendVerificationEmail } from "@/lib/email";
import { z } from "zod";
import { MODEL_LIMITS } from "@/lib/pricing";

// Rate limiter: max 3 signups per IP per 15 minutes
const signupAttempts = new Map<string, number[]>();
const MAX_SIGNUPS = 3;
const WINDOW_MS = 15 * 60 * 1000;

const signupSchema = z.object({
  studioName: z.string().min(2).max(100),
  ownerName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
  subdomain: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  tier: z.enum(["starter", "pro", "elite"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const now = Date.now();
    const entry = signupAttempts.get(ip) || [];
    const recent = entry.filter((t) => now - t < WINDOW_MS);
    if (recent.length >= MAX_SIGNUPS) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please wait 15 minutes." },
        { status: 429 }
      );
    }
    recent.push(now);
    signupAttempts.set(ip, recent);

    const body = await request.json();
    const parsed = signupSchema.parse(body);

    const admin = createAdminClient();

    // Check if subdomain is taken
    const { data: existingStudio } = await admin
      .from("studios")
      .select("id")
      .eq("subdomain", parsed.subdomain)
      .single();

    if (existingStudio) {
      return NextResponse.json(
        { error: "This subdomain is already taken" },
        { status: 409 }
      );
    }

    // Create Supabase auth user
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: parsed.email,
      password: parsed.password,
      email_confirm: false, // Require email verification
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: authError?.message || "Failed to create user" },
        { status: 400 }
      );
    }

    // Calculate trial end date (7 days)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 7);

    const selectedTier = parsed.tier || "starter";

    // Create studio
    const { data: studio, error: studioError } = await admin
      .from("studios")
      .insert({
        name: parsed.studioName,
        subdomain: parsed.subdomain,
        subscription_tier: selectedTier,
        subscription_status: "trialing",
        trial_ends_at: trialEndsAt.toISOString(),
        grace_period_ends_at: trialEndsAt.toISOString(),
        model_limit: MODEL_LIMITS[selectedTier] || 1,
        current_model_count: 0,
        onboarding_completed: false,
        created_by: authData.user.id,
        primary_currency: "USD",
      })
      .select()
      .single();

    if (studioError || !studio) {
      // Rollback: delete the auth user
      await admin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Failed to create studio" },
        { status: 500 }
      );
    }

    // Create owner account
    const nameParts = parsed.ownerName.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || null;

    const { error: accountError } = await admin.from("accounts").insert({
      auth_user_id: authData.user.id,
      studio_id: studio.id,
      email: parsed.email,
      first_name: firstName,
      last_name: lastName,
      role: "owner",
      is_active: true,
      is_super_admin: false,
      works_alone: false,
      cut_percentage: 50,
      operator_cut_percentage: 0,
      weekly_goal_enabled: false,
      payout_method: "cash",
      onboarding_dismissed: false,
      onboarding_completed_steps: [],
    });

    if (accountError) {
      // Rollback
      await admin.from("studios").delete().eq("id", studio.id);
      await admin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    // Create default global settings
    await admin.from("global_settings").insert({
      studio_id: studio.id,
      secondary_currency: "EUR",
      exchange_rate: 1.0,
      exchange_rate_mode: "manual",
      payout_frequency: "biweekly",
      myfreecams_rate: 0.05,
      chaturbate_rate: 0.05,
      stripchat_rate: 0.05,
      bongacams_rate: 0.05,
      cam4_rate: 0.05,
      camsoda_rate: 0.05,
      flirt4free_rate: 0.05,
      livejasmin_rate: 0.05,
    });

    // Create default chat channel
    await admin.from("chat_channels").insert({
      studio_id: studio.id,
      name: "General",
      channel_type: "general",
    });

    // Generate verification link via Supabase
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "signup",
      email: parsed.email,
      password: parsed.password,
    });

    if (linkError) {
      console.error("Failed to generate verification link:", linkError);
    }

    // Send styled verification email via Resend
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getstudioos.com";
    // Build verify URL pointing to our verify-email page with the token_hash
    let verifyUrl = `${appUrl}/verify-email`;
    if (linkData?.properties?.hashed_token) {
      verifyUrl = `${appUrl}/verify-email?token_hash=${linkData.properties.hashed_token}&type=signup`;
    } else if (linkData?.properties?.action_link) {
      // Rewrite Supabase's action_link to go through our verify-email page
      try {
        const actionUrl = new URL(linkData.properties.action_link);
        const tokenHash = actionUrl.searchParams.get("token_hash") || actionUrl.searchParams.get("token");
        if (tokenHash) {
          verifyUrl = `${appUrl}/verify-email?token_hash=${tokenHash}&type=signup`;
        }
      } catch {
        verifyUrl = linkData.properties.action_link;
      }
    }

    const emailResult = await sendVerificationEmail(
      parsed.email,
      nameParts[0],
      parsed.studioName,
      verifyUrl
    );

    if (!emailResult.success) {
      console.error("Verification email failed:", emailResult.error);
      return NextResponse.json({
        success: true,
        email_failed: true,
        message: "Account created but the verification email could not be sent. Please try logging in or contact support.",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Account created. Please check your email to verify your account.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
