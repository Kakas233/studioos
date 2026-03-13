import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VPS_SECRET = process.env.VPS_INTERNAL_SECRET;

/**
 * GET /api/alerts/vps-sync — Called by VPS to get list of active monitors.
 * Replaces the old Base44 `listMonitoredModels` endpoint.
 * Protected by VPS internal secret.
 */
export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-internal-secret") || request.headers.get("api_key");
  if (!VPS_SECRET || secret !== VPS_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const adminDb = createAdminClient();

    const { data: alerts, error } = await adminDb
      .from("member_alerts")
      .select("id, model_username, sites, spending_threshold, is_active")
      .eq("is_active", true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return models with alert IDs so VPS uses consistent model IDs
    const models = (alerts || []).map(alert => ({
      id: alert.id,
      model_username: alert.model_username,
      sites: (alert.sites as string[]) || [],
      spending_threshold: alert.spending_threshold ?? 400,
    }));

    return NextResponse.json({ models });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/alerts/vps-sync — Full sync: push all active alerts to VPS.
 * Called manually or by cron to ensure VPS and DB are in sync.
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-internal-secret");
  const cronSecret = request.headers.get("x-cron-secret");

  const isVpsAuth = VPS_SECRET && secret === VPS_SECRET;
  const isCronAuth = process.env.CRON_SECRET && cronSecret === process.env.CRON_SECRET;

  if (!isVpsAuth && !isCronAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const vpsUrl = process.env.VPS_URL;
  if (!vpsUrl || !VPS_SECRET) {
    return NextResponse.json({ error: "VPS not configured" }, { status: 500 });
  }

  try {
    const adminDb = createAdminClient();

    const { data: alerts, error } = await adminDb
      .from("member_alerts")
      .select("id, model_username, sites, spending_threshold, is_active")
      .eq("is_active", true);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let started = 0;
    let failed = 0;

    for (const alert of alerts || []) {
      const sites = (alert.sites as string[]) || [];
      for (const site of sites) {
        try {
          const res = await fetch(`${vpsUrl}/monitor/start`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Internal-Secret": VPS_SECRET,
            },
            body: JSON.stringify({
              site,
              modelUsername: alert.model_username,
              modelId: alert.id,
            }),
            signal: AbortSignal.timeout(10000),
          });
          if (res.ok) started++;
          else failed++;
        } catch {
          failed++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      synced: started,
      failed,
      total_alerts: alerts?.length || 0,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
