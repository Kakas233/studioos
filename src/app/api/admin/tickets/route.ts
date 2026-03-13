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
 * GET /api/admin/tickets — Paginated support tickets for super admin.
 * Query params: page (default 1), limit (default 50), status (optional filter).
 */
export async function GET(request: NextRequest) {
  try {
    const account = await validateSuperAdminSession();
    if (!account) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const status = searchParams.get("status");

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = adminClient
      .from("support_tickets")
      .select("*", { count: "exact" })
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (status) {
      query = query.eq("status", status as "open" | "in_progress" | "resolved" | "closed");
    }

    const { data: tickets, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Get studio names for the tickets
    const studioIds = [...new Set((tickets || []).map((t) => t.studio_id).filter(Boolean))];
    let studioMap: Record<string, string> = {};
    if (studioIds.length > 0) {
      const { data: studios } = await adminClient
        .from("studios")
        .select("id, name")
        .in("id", studioIds);
      studioMap = Object.fromEntries((studios || []).map((s) => [s.id, s.name]));
    }

    // Get account names
    const accountIds = [...new Set((tickets || []).map((t) => t.account_id).filter(Boolean))];
    let accountMap: Record<string, string> = {};
    if (accountIds.length > 0) {
      const { data: accounts } = await adminClient
        .from("accounts")
        .select("id, first_name, last_name, email")
        .in("id", accountIds);
      accountMap = Object.fromEntries(
        (accounts || []).map((a) => [a.id, a.first_name ? `${a.first_name} ${a.last_name || ""}`.trim() : a.email])
      );
    }

    // Get distinct statuses for filter
    const { data: allTickets } = await adminClient
      .from("support_tickets")
      .select("status");
    const statuses = [...new Set((allTickets || []).map((t) => t.status))].sort();

    return NextResponse.json({
      tickets: (tickets || []).map((t) => ({
        ...t,
        studio_name: studioMap[t.studio_id] || "Unknown",
        account_name: accountMap[t.account_id] || "Unknown",
      })),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      statuses,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/tickets — Update ticket status (e.g. close, escalate).
 */
export async function PATCH(request: NextRequest) {
  try {
    const account = await validateSuperAdminSession();
    if (!account) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { ticket_id, status, is_escalated } = await request.json();
    if (!ticket_id) {
      return NextResponse.json({ error: "ticket_id required" }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (status) updateData.status = status;
    if (typeof is_escalated === "boolean") updateData.is_escalated = is_escalated;

    const { error } = await adminClient
      .from("support_tickets")
      .update(updateData)
      .eq("id", ticket_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
