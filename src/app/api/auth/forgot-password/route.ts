import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTempPasswordEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars.charAt(b % chars.length)).join("");
}

// Rate limiter
const forgotAttempts = new Map<string, number[]>();
const MAX_FORGOT = 3;
const FORGOT_WINDOW = 15 * 60 * 1000; // 15 minutes

const GENERIC_RESPONSE = {
  success: true,
  message: "If an account with that email exists, a temporary password has been sent.",
};

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";
    const now = Date.now();
    const entry = forgotAttempts.get(ip) || [];
    const recent = entry.filter((t) => now - t < FORGOT_WINDOW);

    if (recent.length >= MAX_FORGOT) {
      return NextResponse.json(GENERIC_RESPONSE);
    }
    recent.push(now);
    forgotAttempts.set(ip, recent);

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Find account
    const { data: account } = await admin
      .from("accounts")
      .select("id, email, role, is_active, studio_id, auth_user_id")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (!account) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    // Only owners and admins can reset passwords this way
    if (!["owner", "admin"].includes(account.role)) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    if (!account.is_active) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    // Generate temp password
    const tempPassword = generateTempPassword();

    // Update Supabase auth user password
    if (account.auth_user_id) {
      const { error: updateError } = await admin.auth.admin.updateUserById(
        account.auth_user_id,
        { password: tempPassword }
      );
      if (updateError) {
        console.error("Failed to update auth password:", updateError);
        return NextResponse.json(GENERIC_RESPONSE);
      }
    }

    // Get studio name
    let studioName = "your studio";
    if (account.studio_id) {
      const { data: studio } = await admin
        .from("studios")
        .select("name")
        .eq("id", account.studio_id)
        .single();
      if (studio) studioName = studio.name;
    }

    // Send temp password email
    const emailResult = await sendTempPasswordEmail(
      account.email,
      tempPassword,
      studioName
    );

    if (!emailResult.success) {
      console.error("Temp password email failed:", emailResult.error);
      return NextResponse.json(
        { error: "Failed to send email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
