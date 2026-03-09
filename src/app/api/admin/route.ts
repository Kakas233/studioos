import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin — Super admin aggregated dashboard data.
 * Returns total studios, total accounts, total revenue, and error counts.
 * Only accessible by super admins.
 */
export async function GET() {
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

    // Fetch aggregated data using admin client (bypasses RLS)

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
