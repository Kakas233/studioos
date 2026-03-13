import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

async function validateSuperAdminSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("sa_session")?.value;
  if (!sessionToken) return null;

  const adminClient = createAdminClient();

  const { data: sessions } = await (adminClient.from("sessions") as any)
    .select("id, account_id, expires_at")
    .eq("token", sessionToken)
    .limit(1);

  if (!sessions || sessions.length === 0) return null;
  if (new Date(sessions[0].expires_at) < new Date()) return null;

  const { data: accounts } = await adminClient
    .from("accounts")
    .select("id, email, is_super_admin")
    .eq("id", sessions[0].account_id)
    .limit(1);

  if (!accounts || accounts.length === 0 || !accounts[0].is_super_admin) return null;
  return accounts[0];
}

/**
 * GET /api/admin/errors — Paginated error logs for super admin.
 * Query params: page (default 1), limit (default 50), error_type (optional filter).
 * Super admin only (requires 2FA session).
 */
export async function GET(request: NextRequest) {
  try {
    const account = await validateSuperAdminSession();
    if (!account) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "50", 10))
    );
    const errorType = searchParams.get("error_type");

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query
    let query = adminClient
      .from("error_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (errorType) {
      query = query.eq("error_type", errorType);
    }

    const { data: errors, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Get distinct error types for filter dropdown
    const { data: allErrors } = await adminClient
      .from("error_logs")
      .select("error_type");

    const errorTypes = [
      ...new Set((allErrors || []).map((e) => e.error_type)),
    ].sort();

    return NextResponse.json({
      errors: errors || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      errorTypes,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
