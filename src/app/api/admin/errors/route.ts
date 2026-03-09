import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/errors — Paginated error logs for super admin.
 * Query params: page (default 1), limit (default 50), error_type (optional filter).
 * Super admin only.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check super admin status
    const adminClient = createAdminClient();

    const { data: account } = await adminClient
      .from("accounts")
      .select("id, email, is_super_admin")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .single();

    const isSuperAdmin =
      account?.is_super_admin === true ||
      user.email === process.env.SUPER_ADMIN_EMAIL;

    if (!isSuperAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
