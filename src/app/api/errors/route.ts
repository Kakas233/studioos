import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/errors — Client error reporting endpoint.
 * Receives error reports from the browser and stores them in error_logs table.
 * Part of fix #6: error tracking visible in super admin panel.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    // Get the current user (may be null for unauthenticated errors)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let accountId: string | null = null;
    let studioId: string | null = null;

    if (user) {
      const { data: account } = await supabase
        .from("accounts")
        .select("id, studio_id")
        .eq("auth_user_id", user.id)
        .single();

      if (account) {
        accountId = account.id;
        studioId = account.studio_id;
      }
    }

    // Use admin client to bypass RLS for error logging
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const adminClient = createAdminClient();

    await adminClient.from("error_logs").insert({
      studio_id: studioId,
      error_type: body.error_type || "unknown",
      message: body.message || "No message",
      stack_trace: body.stack_trace || null,
      url: body.url || null,
      user_agent: body.user_agent || null,
      account_id: accountId,
      metadata: body.metadata || null,
    });

    return NextResponse.json({ success: true });
  } catch {
    // Don't fail — error reporting should never break the app
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
