import { NextResponse } from "next/server";
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
 * GET /api/admin — Super admin aggregated dashboard data.
 * Returns total studios, total accounts, total revenue, and error counts.
 * Only accessible by super admins (requires 2FA session).
 */
export async function GET() {
  try {
    const account = await validateSuperAdminSession();
    if (!account) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Total studios
    const { count: totalStudios } = await adminClient
      .from("studios")
      .select("*", { count: "exact", head: true });

    // Total accounts
    const { count: totalAccounts } = await adminClient
      .from("accounts")
      .select("*", { count: "exact", head: true });

    // Total active accounts
    const { count: activeAccounts } = await adminClient
      .from("accounts")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // Total revenue (sum of all earnings)
    const { data: earningsData } = await adminClient
      .from("earnings")
      .select("total_gross_usd");

    const totalRevenue = (earningsData || []).reduce(
      (sum, e) => sum + (Number(e.total_gross_usd) || 0),
      0
    );

    // Error count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: errorCount } = await adminClient
      .from("error_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString());

    // Total error count (all time)
    const { count: totalErrors } = await adminClient
      .from("error_logs")
      .select("*", { count: "exact", head: true });

    // Studios by subscription tier
    const { data: studios } = await adminClient
      .from("studios")
      .select("subscription_tier");

    const tierBreakdown: Record<string, number> = {};
    (studios || []).forEach((s) => {
      const tier = s.subscription_tier || "free";
      tierBreakdown[tier] = (tierBreakdown[tier] || 0) + 1;
    });

    return NextResponse.json({
      totalStudios: totalStudios || 0,
      totalAccounts: totalAccounts || 0,
      activeAccounts: activeAccounts || 0,
      totalRevenue,
      errorCount: errorCount || 0,
      totalErrors: totalErrors || 0,
      tierBreakdown,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
