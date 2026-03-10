import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/admin/studios — List all studios with account counts and subscription info.
 * Super admin only.
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

    // Fetch all studios
    const { data: studios, error: studiosError } = await adminClient
      .from("studios")
      .select("*")
      .order("created_at", { ascending: false });

    if (studiosError) {
      return NextResponse.json(
        { error: studiosError.message },
        { status: 400 }
      );
    }

    // Fetch accounts to compute per-studio counts (only needed columns)
    const studioIds = (studios || []).map((s) => s.id);
    const { data: accounts } = studioIds.length > 0
      ? await adminClient
          .from("accounts")
          .select("studio_id, role, is_active")
          .in("studio_id", studioIds)
      : { data: [] };

    // Build per-studio account counts
    const studioAccountMap: Record<
      string,
      { total: number; active: number; models: number }
    > = {};

    (accounts || []).forEach((acc) => {
      if (!studioAccountMap[acc.studio_id]) {
        studioAccountMap[acc.studio_id] = { total: 0, active: 0, models: 0 };
      }
      studioAccountMap[acc.studio_id].total++;
      if (acc.is_active) studioAccountMap[acc.studio_id].active++;
      if (acc.role === "model" && acc.is_active)
        studioAccountMap[acc.studio_id].models++;
    });

    // Enrich studios with account counts
    const enrichedStudios = (studios || []).map((studio) => ({
      id: studio.id,
      name: studio.name,
      subdomain: studio.subdomain,
      subscription_tier: studio.subscription_tier,
      subscription_status: studio.subscription_status,
      model_limit: studio.model_limit,
      current_model_count: studio.current_model_count,
      onboarding_completed: studio.onboarding_completed,
      created_at: studio.created_at,
      updated_at: studio.updated_at,
      account_counts: studioAccountMap[studio.id] || {
        total: 0,
        active: 0,
        models: 0,
      },
    }));

    return NextResponse.json(enrichedStudios);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
