import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { timingSafeEqual } from "crypto";

// Allow up to 2 minutes for shift correlation
export const maxDuration = 120;

const BREAK_TYPES = new Set(["away", "on_break", "break"]);
const OFFLINE_TYPES = new Set(["offline", "unknown"]);
const PUBLIC_TYPES = new Set(["free_chat", "public"]);
const PRIVATE_TYPES = new Set([
  "private_chat", "nude_chat", "semiprivate", "vip_chat",
  "true_private", "paid_chat", "private", "hidden", "p2p",
]);
const GROUP_TYPES = new Set([
  "member_chat", "group_chat", "happy_hour", "party_chat",
  "pre_gold_show", "gold_show", "group", "ticket",
]);

function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${cronSecret}`;
  if (authHeader.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
}

/**
 * GET /api/cron/correlate-shifts — Called by Vercel Cron (hourly).
 */
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runCorrelation({ daysBack: 14, shiftId: null });
}

/**
 * POST /api/cron/correlate-shifts — Called manually with optional params.
 * Body: { days_back?: number, shift_id?: string }
 */
export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  return runCorrelation({
    daysBack: body.days_back || 14,
    shiftId: body.shift_id || null,
  });
}

async function runCorrelation(opts: { daysBack: number; shiftId: string | null }) {
  try {
    const admin = createAdminClient();
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - opts.daysBack * 86400000)
      .toISOString()
      .split("T")[0];

    console.log(`Correlating shifts from ${cutoffDate} onwards`);

    // Fetch shifts in the date range
    let shiftsQuery = admin
      .from("shifts")
      .select("id, studio_id, model_id, start_time, end_time")
      .gte("start_time", cutoffDate + "T00:00:00Z")
      .not("start_time", "is", null)
      .not("end_time", "is", null);

    if (opts.shiftId) {
      shiftsQuery = shiftsQuery.eq("id", opts.shiftId);
    }

    const { data: shifts, error: shiftsError } = await shiftsQuery;
    if (shiftsError || !shifts) {
      return NextResponse.json({ error: "Failed to fetch shifts" }, { status: 500 });
    }

    if (shifts.length === 0) {
      return NextResponse.json({ success: true, message: "No shifts to correlate", analyzed: 0 });
    }

    console.log(`Found ${shifts.length} shifts to correlate`);

    // Fetch stream segments for the date range
    const { data: segments } = await admin
      .from("stream_segments")
      .select("id, cam_account_id, start_time, end_time, show_type, platform")
      .gte("date", cutoffDate);

    if (!segments || segments.length === 0) {
      return NextResponse.json({ success: true, message: "No segments in range", analyzed: 0 });
    }

    console.log(`Found ${segments.length} stream segments in range`);

    // Fetch active cam accounts for model -> cam_account mapping
    const { data: camAccounts } = await admin
      .from("cam_accounts")
      .select("id, model_id, platform")
      .eq("is_active", true);

    // Build model -> cam account IDs map
    const modelCamAccountIds: Record<string, string[]> = {};
    const camPlatformMap: Record<string, string> = {};
    for (const ca of camAccounts || []) {
      if (!modelCamAccountIds[ca.model_id]) modelCamAccountIds[ca.model_id] = [];
      modelCamAccountIds[ca.model_id].push(ca.id);
      camPlatformMap[ca.id] = ca.platform;
    }

    let analyzedCount = 0;

    for (const shift of shifts) {
      try {
        const shiftStart = new Date(shift.start_time);
        const shiftEnd = new Date(shift.end_time);
        const shiftDate = shiftStart.toISOString().split("T")[0];
        const scheduledDurationMins =
          (shiftEnd.getTime() - shiftStart.getTime()) / 60000;

        if (scheduledDurationMins <= 0) continue;

        const modelCamIds = modelCamAccountIds[shift.model_id] || [];
        if (modelCamIds.length === 0) continue;

        const modelCamIdSet = new Set(modelCamIds);

        // Expand window by 30 min each side to catch early starts / late ends
        const windowStart = new Date(shiftStart.getTime() - 30 * 60000);
        const windowEnd = new Date(shiftEnd.getTime() + 30 * 60000);

        const shiftSegments = segments.filter((seg) => {
          if (!modelCamIdSet.has(seg.cam_account_id)) return false;
          const segStart = new Date(seg.start_time);
          const segEnd = new Date(seg.end_time);
          return segStart < windowEnd && segEnd > windowStart;
        });

        // Calculate metrics
        let actualStart: Date | null = null;
        let actualEnd: Date | null = null;
        let totalOnlineMinutes = 0;
        let totalBreakMinutes = 0;
        let totalPublicMinutes = 0;
        let totalPrivateMinutes = 0;
        let totalGroupMinutes = 0;
        const platformsUsed = new Set<string>();

        const sortedSegs = [...shiftSegments].sort(
          (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        );

        for (const seg of sortedSegs) {
          const segStart = new Date(seg.start_time);
          const segEnd = new Date(seg.end_time);

          // Clip segment to shift window
          const clipStart = segStart < shiftStart ? shiftStart : segStart;
          const clipEnd = segEnd > shiftEnd ? shiftEnd : segEnd;
          if (clipStart >= clipEnd) continue;

          const clipMins = (clipEnd.getTime() - clipStart.getTime()) / 60000;
          const showType = seg.show_type || "unknown";

          if (BREAK_TYPES.has(showType)) {
            totalBreakMinutes += clipMins;
          } else if (OFFLINE_TYPES.has(showType)) {
            // skip offline
          } else {
            totalOnlineMinutes += clipMins;
            platformsUsed.add(camPlatformMap[seg.cam_account_id] || seg.platform);

            if (PUBLIC_TYPES.has(showType)) totalPublicMinutes += clipMins;
            else if (PRIVATE_TYPES.has(showType)) totalPrivateMinutes += clipMins;
            else if (GROUP_TYPES.has(showType)) totalGroupMinutes += clipMins;
            else totalPublicMinutes += clipMins; // fallback
          }

          // Track actual start/end (non-offline/non-break only)
          if (!OFFLINE_TYPES.has(showType) && !BREAK_TYPES.has(showType)) {
            if (!actualStart || segStart < actualStart) actualStart = segStart;
            if (!actualEnd || segEnd > actualEnd) actualEnd = segEnd;
          }
        }

        // Late start / early end
        let lateStartMinutes = 0;
        let earlyEndMinutes = 0;

        if (actualStart) {
          lateStartMinutes = Math.max(
            0,
            (actualStart.getTime() - shiftStart.getTime()) / 60000
          );
        } else {
          lateStartMinutes = scheduledDurationMins; // never started
        }

        if (actualEnd) {
          earlyEndMinutes = Math.max(
            0,
            (shiftEnd.getTime() - actualEnd.getTime()) / 60000
          );
        } else {
          earlyEndMinutes = scheduledDurationMins;
        }

        // Adherence = % of scheduled time actually online, capped at 100
        const adherence = Math.min(
          100,
          Math.round((totalOnlineMinutes / scheduledDurationMins) * 100)
        );

        const analysisData = {
          studio_id: shift.studio_id,
          shift_id: shift.id,
          model_id: shift.model_id,
          shift_date: shiftDate,
          scheduled_start: shift.start_time,
          scheduled_end: shift.end_time,
          actual_start: actualStart ? actualStart.toISOString() : null,
          actual_end: actualEnd ? actualEnd.toISOString() : null,
          late_start_minutes: Math.round(lateStartMinutes),
          early_end_minutes: Math.round(earlyEndMinutes),
          total_online_minutes: Math.round(totalOnlineMinutes),
          total_break_minutes: Math.round(totalBreakMinutes),
          adherence_percentage: adherence,
          platforms_used: [...platformsUsed],
          segment_count: shiftSegments.filter(
            (s) => !OFFLINE_TYPES.has(s.show_type || "unknown")
          ).length,
        };

        // Upsert ShiftAnalysis
        const { data: existing } = await admin
          .from("shift_analyses")
          .select("id")
          .eq("shift_id", shift.id)
          .maybeSingle();

        if (existing) {
          await admin
            .from("shift_analyses")
            .update(analysisData)
            .eq("id", existing.id);
        } else {
          await admin.from("shift_analyses").insert(analysisData);
        }

        analyzedCount++;
      } catch (err) {
        console.error(`Error correlating shift ${shift.id}:`, err);
      }
    }

    console.log(`Correlation complete: ${analyzedCount}/${shifts.length} analyzed`);
    return NextResponse.json({
      success: true,
      analyzed: analyzedCount,
      total_shifts: shifts.length,
    });
  } catch (err) {
    console.error("correlateShifts error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
