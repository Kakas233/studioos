import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendVerificationEmail } from "@/lib/email";

// Rate limiter: max 3 resends per email per 15 minutes
const resendAttempts = new Map<string, number[]>();
const MAX_RESENDS = 3;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit
    const now = Date.now();
    const entry = resendAttempts.get(normalizedEmail) || [];
    const recent = entry.filter((t) => now - t < WINDOW_MS);
    if (recent.length >= MAX_RESENDS) {
      return NextResponse.json(
        { error: "Too many resend attempts. Please wait 15 minutes." },
        { status: 429 }
      );
    }
    recent.push(now);
    resendAttempts.set(normalizedEmail, recent);

    const admin = createAdminClient();

    // Find the account
    const { data: account } = await admin
      .from("accounts")
      .select("first_name, studio_id")
      .eq("email", normalizedEmail)
      .single();

    if (!account) {
      // Don't reveal whether the email exists
      return NextResponse.json({
        success: true,
        message: "If an account exists, a new verification email has been sent.",
      });
    }

    // Get studio name
    let studioName = "Your Studio";
    if (account.studio_id) {
      const { data: studio } = await admin
        .from("studios")
        .select("name")
        .eq("id", account.studio_id)
        .single();
      if (studio) studioName = studio.name;
    }

    // Generate a new verification link
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "signup",
      email: normalizedEmail,
      password: crypto.randomUUID(), // dummy — generateLink requires it but won't change the password
    });

    if (linkError) {
      console.error("Failed to generate verification link:", linkError);
      return NextResponse.json(
        { error: "Failed to generate verification link. The account may already be verified." },
        { status: 400 }
      );
    }

    // Build verify URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://getstudioos.com";
    let verifyUrl = `${appUrl}/verify-email`;
    if (linkData?.properties?.hashed_token) {
      verifyUrl = `${appUrl}/verify-email?token_hash=${linkData.properties.hashed_token}&type=signup`;
    } else if (linkData?.properties?.action_link) {
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

    // Send the email
    const emailResult = await sendVerificationEmail(
      normalizedEmail,
      account.first_name || "there",
      studioName,
      verifyUrl
    );

    if (!emailResult.success) {
      console.error("Resend verification email failed:", emailResult.error);
      return NextResponse.json(
        { error: "Failed to send verification email. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
