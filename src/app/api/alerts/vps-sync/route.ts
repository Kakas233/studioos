import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VPS_SECRET = process.env.VPS_INTERNAL_SECRET;

/**
 * GET /api/alerts/vps-sync — Called by VPS to get list of active monitors.
 * Replaces the old Base44 `listMonitoredModels` endpoint.
 * Protected by VPS internal secret.
 */
export async function GET(request: NextRequest) {
  const secret = request.headers.get("x-internal-secret");
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

    // Transform to the format VPS expects: one entry per site per model
    const monitors: { modelId: string; modelUsername: string; site: string; spendingThreshold: number }[] = [];

    for (const alert of alerts || []) {
      const sites = (alert.sites as string[]) || [];
      for (const site of sites) {
        monitors.push({
          modelId: alert.id,
          modelUsername: alert.model_username,
          site,
          spendingThreshold: alert.spending_threshold ?? 0,
        });
      }
    }

    return NextResponse.json({ monitors, count: monitors.length });
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
