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
 * GET /api/admin/studios — List all studios with account counts and subscription info.
 * Super admin only (requires 2FA session).
 */
export async function GET() {
  try {
    const account = await validateSuperAdminSession();
    if (!account) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();

    // Fetch all studios
    const { data: studios, error: studiosError } = await adminClient
      .from("studios")
      .select("id, name, subdomain, subscription_tier, subscription_status, model_limit, current_model_count, onboarding_completed, created_at, updated_at")
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
