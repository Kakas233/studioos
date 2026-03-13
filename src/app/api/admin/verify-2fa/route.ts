import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";
import { checkRateLimit, recordRateLimitAttempt } from "@/lib/rate-limit";

function generateSessionToken(): string {
  const bytes = crypto.randomBytes(64);
  return bytes.toString("hex");
}

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

    if (!(await checkRateLimit(ip, "2fa"))) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many attempts. Please try again in 15 minutes.",
        },
        { status: 429 }
      );
    }

    const { code } = await request.json();
    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;

    if (!code) {
      return NextResponse.json({
        success: false,
        error: "Verification code is required",
      });
    }

    if (!SUPER_ADMIN_EMAIL) {
      return NextResponse.json(
        { success: false, error: "Server misconfigured" },
        { status: 500 }
      );
    }

    const adminClient = createAdminClient();

    // Find the 2FA verification record
    const { data: verifications } = await (adminClient
      .from("email_verifications") as any)
      .select("id, email, token, expires_at, verified")
      .eq("email", SUPER_ADMIN_EMAIL.toLowerCase())
      .eq("token", code)
      .eq("studio_id", "super_admin_2fa")
      .eq("verified", false)
      .limit(1);

    if (!verifications || verifications.length === 0) {
      await recordRateLimitAttempt(ip, "2fa");
      return NextResponse.json({
        success: false,
        error: "Invalid or expired verification code",
      });
    }

    const verification = verifications[0];

    // Check expiry
    if (new Date(verification.expires_at) < new Date()) {
      await (adminClient
        .from("email_verifications") as any)
        .delete()
        .eq("id", verification.id);
      return NextResponse.json({
        success: false,
        error: "Verification code has expired. Please log in again.",
      });
    }

    // Delete used verification record
    await (adminClient
      .from("email_verifications") as any)
      .delete()
      .eq("id", verification.id);

    // Get the super admin account
    const { data: accounts } = await adminClient
      .from("accounts")
      .select("id, email, first_name, role, studio_id, is_super_admin")
      .eq("email", SUPER_ADMIN_EMAIL.toLowerCase())
      .limit(1);

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({
        success: false,
        error: "Super admin account not found",
      });
    }

    const account = accounts[0];

    // Create session with crypto-secure token
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(
      Date.now() + 8 * 60 * 60 * 1000
    ).toISOString(); // 8 hours

    await (adminClient.from("sessions") as any).insert({
      account_id: account.id,
      token: sessionToken,
      expires_at: expiresAt,
    });

    console.log("Super admin 2FA verified, session created");

    const response = NextResponse.json({
      success: true,
      account: {
        id: account.id,
        email: account.email,
        first_name: account.first_name,
        role: account.role,
        studio_id: account.studio_id,
        is_verified: true,
        is_super_admin: true,
      },
    });

    // Set httpOnly cookie instead of returning token to client
    response.cookies.set("sa_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60, // 8 hours
    });

    return response;
  } catch (error) {
    console.error("Super admin 2FA verify error:", error);
    return NextResponse.json(
      { success: false, error: "Verification failed" },
      { status: 500 }
    );
  }
}
