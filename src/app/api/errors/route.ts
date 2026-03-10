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

    const errorType = typeof body.error_type === "string" ? body.error_type.slice(0, 100) : "unknown";
    const message = typeof body.message === "string" ? body.message.slice(0, 2000) : "No message";
    const stackTrace = typeof body.stack_trace === "string" ? body.stack_trace.slice(0, 10000) : null;
    const url = typeof body.url === "string" ? body.url.slice(0, 2000) : null;
    const userAgent = typeof body.user_agent === "string" ? body.user_agent.slice(0, 500) : null;

    await adminClient.from("error_logs").insert({
      studio_id: studioId,
      error_type: errorType,
      message,
      stack_trace: stackTrace,
      url,
      user_agent: userAgent,
      account_id: accountId,
      metadata: body.metadata && typeof body.metadata === "object" ? body.metadata : null,
    });

    return NextResponse.json({ success: true });
  } catch {
    // Don't fail — error reporting should never break the app
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
