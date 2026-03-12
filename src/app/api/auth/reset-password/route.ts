import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/auth/reset-password
 * Two modes:
 * 1. { email } — sends a password reset email link (public)
 * 2. { account_id, new_password } — admin directly sets a user's password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Mode 2: Admin direct password reset
    if (body.account_id && body.new_password) {
      const { account_id, new_password } = body;

      if (!new_password || new_password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }

      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const adminDb = createAdminClient();

      // Verify the caller is an admin/owner in the same studio
      const { data: callerAccount } = await adminDb
        .from("accounts")
        .select("studio_id, role")
        .eq("auth_user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!callerAccount || !["owner", "admin"].includes(callerAccount.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Get the target account and verify same studio
      const { data: targetAccount } = await adminDb
        .from("accounts")
        .select("auth_user_id, studio_id")
        .eq("id", account_id)
        .single();

      if (!targetAccount || targetAccount.studio_id !== callerAccount.studio_id) {
        return NextResponse.json({ error: "Account not found" }, { status: 404 });
      }

      // Use admin API to set the password directly
      const { error } = await adminDb.auth.admin.updateUserById(
        targetAccount.auth_user_id,
        { password: new_password }
      );

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    // Mode 1: Email-based password reset
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    });

    if (error) {
      // Don't reveal if the email exists or not
      console.error("Password reset error:", error.message);
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a reset link has been sent.",
    });
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
