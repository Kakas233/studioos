import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { timingSafeEqual } from "crypto";

// Allow up to 4 minutes for scraping all active cam accounts
export const maxDuration = 240;

const ACTIVITY_TO_SHOW_TYPE: Record<number, string> = {
  0: "unknown", 1: "free_chat", 2: "private_chat", 3: "nude_chat",
  4: "member_chat", 5: "away", 6: "on_break", 7: "group_chat",
  8: "semiprivate", 9: "vip_chat", 10: "happy_hour", 11: "party_chat",
  12: "pre_gold_show", 13: "gold_show", 22: "true_private",
  40: "paid_chat", 100: "offline",
};

const ONLINE_SHOW_TYPES = new Set([
  "free_chat", "private_chat", "nude_chat", "member_chat",
  "group_chat", "semiprivate", "vip_chat", "happy_hour",
  "party_chat", "pre_gold_show", "gold_show", "true_private", "paid_chat",
]);

const PLATFORM_API_MAP: Record<string, string> = {
  MyFreeCams: "MyFreeCams", Chaturbate: "Chaturbate",
  StripChat: "StripChat", BongaCams: "BongaCams",
  Cam4: "Cam4", CamSoda: "CamSoda",
  Flirt4Free: "Flirt4Free", LiveJasmin: "LiveJasmin",
};

interface Activity {
  created_at: string;
  seconds?: number | null;
  activity_status_id: number;
}

function parseDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  return new Date(dateStr.replace(" ", "T") + "Z");
}

function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

async function fetchRecentActivities(platform: string, username: string): Promise<Activity[] | null> {
  const platformKey = PLATFORM_API_MAP[platform] || platform;
  const baseUrl = `https://api.mycamgirl.net/stats/${platformKey}/${username}/model-activities?per_page=100`;

  // Fetch page 1 to get last_page
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const firstRes = await fetch(`${baseUrl}&page=1`, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
    });
    clearTimeout(timeout);
    if (firstRes.status === 404) return null; // Model not found
    if (!firstRes.ok) return null;
    const firstData = await firstRes.json();
    const lastPage = firstData.last_page || 1;

    // If only 1 page, return it directly
    if (lastPage === 1) return firstData.data || [];

    // Fetch the last page (most recent activities)
    const controller2 = new AbortController();
    const timeout2 = setTimeout(() => controller2.abort(), 20000);
    try {
      const lastRes = await fetch(`${baseUrl}&page=${lastPage}`, {
        signal: controller2.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "application/json",
        },
      });
      clearTimeout(timeout2);
      if (!lastRes.ok) return null;
      const lastData = await lastRes.json();

      // Also fetch second-to-last page for better coverage
      // (last page may have very few items)
      const activities = lastData.data || [];
      if (lastPage >= 2 && activities.length < 50) {
        const controller3 = new AbortController();
        const timeout3 = setTimeout(() => controller3.abort(), 20000);
        try {
          const prevRes = await fetch(`${baseUrl}&page=${lastPage - 1}`, {
            signal: controller3.signal,
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              Accept: "application/json",
            },
          });
          clearTimeout(timeout3);
          if (prevRes.ok) {
            const prevData = await prevRes.json();
            if (prevData.data) {
              activities.unshift(...prevData.data);
            }
          }
        } catch {
          // Non-critical, continue with what we have
        }
      }

      return activities;
    } catch {
      return null;
    }
  } catch (err) {
    clearTimeout(timeout);
    console.error(`Scrape error ${platform}/${username}:`, err);
    return null;
  }
}

function randomDelay(minMs: number, maxMs: number) {
  return new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs)
  );
}

/**
 * GET /api/cron/scrape-cam-data
 * Periodic scraper: fetches most recent streaming data for all active cam accounts.
 * Updates streaming_sessions (live status) and adds new stream_segments + daily_stream_stats.
 * Called every 15 minutes via Vercel Cron.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret — mandatory, timing-safe comparison
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("CRON_SECRET environment variable is not set");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${cronSecret}`;
  const isValid =
    authHeader.length === expected.length &&
    timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
  if (!isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  try {
    // Get all active cam accounts
    const { data: camAccounts, error } = await admin
      .from("cam_accounts")
      .select("id, studio_id, model_id, platform, username")
      .eq("is_active", true);

    if (error || !camAccounts) {
      return NextResponse.json({ error: "Failed to fetch cam accounts" }, { status: 500 });
    }

    console.log(`Scraping ${camAccounts.length} active cam accounts`);

    let updated = 0;
    let errors = 0;
    const now = new Date();
    const todayStr = toDateStr(now);

    for (const ca of camAccounts) {
      try {
        const activities = await fetchRecentActivities(ca.platform, ca.username);
        if (!activities || activities.length === 0) {
          // No data — mark as offline
          await upsertStreamingSession(admin, ca, false, "offline");
          continue;
        }

        // Filter to activities with valid durations
        const validActivities = activities.filter((a) => (a.seconds ?? 0) > 0);

        // Determine live status from most recent ONLINE activity
        const onlineActivities = validActivities.filter(
          (a) => ONLINE_SHOW_TYPES.has(ACTIVITY_TO_SHOW_TYPE[a.activity_status_id] ?? "offline")
        );
        const sorted = [...onlineActivities].sort((a, b) =>
          (b.created_at || "").localeCompare(a.created_at || "")
        );
        const latest = sorted[0];
        let isLive = false;
        let latestShowType = "offline";

        if (latest) {
          latestShowType = ACTIVITY_TO_SHOW_TYPE[latest.activity_status_id] ?? "offline";
          const latestEndTime = parseDate(latest.created_at);
          // Consider live if last online activity ended within 25 minutes
          isLive = !!latestEndTime && (now.getTime() - latestEndTime.getTime()) <= 25 * 60 * 1000;
        }

        await upsertStreamingSession(admin, ca, isLive, isLive ? latestShowType : "offline");

        // Process today's activities into segments and stats
        const todayActivities = validActivities.filter((act) => {
          const endTime = parseDate(act.created_at);
          if (!endTime) return false;
          const durationSec = act.seconds ?? 0;
          const startTime = new Date(endTime.getTime() - durationSec * 1000);
          // Include if the activity overlaps with today at all
          const todayStart = new Date(todayStr + "T00:00:00Z");
          const todayEnd = new Date(todayStr + "T23:59:59.999Z");
          return startTime <= todayEnd && endTime >= todayStart;
        });

        if (todayActivities.length > 0) {
          await processDayData(admin, ca, todayActivities, todayStr);
        }

        updated++;
      } catch (err) {
        console.error(`Error scraping ${ca.platform}/${ca.username}:`, err);
        errors++;
      }

      // Small delay between accounts to avoid rate limiting
      await randomDelay(500, 1500);
    }

    console.log(`Scrape complete: ${updated} updated, ${errors} errors`);
    return NextResponse.json({ success: true, updated, errors, total: camAccounts.length });
  } catch (err) {
    console.error("Cron scrape error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

async function upsertStreamingSession(
  admin: ReturnType<typeof createAdminClient>,
  ca: { id: string; studio_id: string },
  isLive: boolean,
  showType: string
) {
  const { data: existing } = await admin
    .from("streaming_sessions")
    .select("id")
    .eq("cam_account_id", ca.id)
    .maybeSingle();

  const sessionData = {
    studio_id: ca.studio_id,
    cam_account_id: ca.id,
    is_currently_live: isLive,
    show_type: showType as "free_chat" | "private_chat" | "offline",
    scraped_at: new Date().toISOString(),
  };

  if (existing) {
    await admin.from("streaming_sessions").update(sessionData).eq("id", existing.id);
  } else {
    await admin.from("streaming_sessions").insert(sessionData);
  }
}

async function processDayData(
  admin: ReturnType<typeof createAdminClient>,
  ca: { id: string; studio_id: string; model_id: string; platform: string },
  activities: Activity[],
  dayStr: string
) {
  // Calculate stats
  const onlineIntervals: { start: Date; end: Date }[] = [];
  const granular: Record<string, number> = {};

  for (const act of activities) {
    const endTime = parseDate(act.created_at);
    if (!endTime) continue;
    const durationSec = act.seconds ?? 0;
    if (durationSec <= 0) continue;
    const startTime = new Date(endTime.getTime() - durationSec * 1000);
    const showType = ACTIVITY_TO_SHOW_TYPE[act.activity_status_id] ?? "unknown";

    // Clip to day boundaries
    const dayStart = new Date(dayStr + "T00:00:00Z");
    const dayEnd = new Date(dayStr + "T23:59:59.999Z");
    const s = startTime < dayStart ? dayStart : startTime;
    const e = endTime > dayEnd ? dayEnd : endTime;
    if (s >= e) continue;

    const mins = (e.getTime() - s.getTime()) / 60000;
    granular[showType] = (granular[showType] || 0) + mins;
    if (ONLINE_SHOW_TYPES.has(showType)) {
      onlineIntervals.push({ start: s, end: e });
    }
  }

  // Merge overlapping online intervals
  const sorted = [...onlineIntervals].sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged: { start: Date; end: Date }[] = [];
  for (const iv of sorted) {
    const last = merged[merged.length - 1];
    if (last && iv.start <= last.end) {
      if (iv.end > last.end) last.end = iv.end;
    } else {
      merged.push({ start: iv.start, end: iv.end });
    }
  }
  const totalOnlineMinutes = Math.round(
    merged.reduce((sum, iv) => sum + (iv.end.getTime() - iv.start.getTime()) / 60000, 0)
  );

  const statsData = {
    cam_account_id: ca.id,
    model_id: ca.model_id,
    studio_id: ca.studio_id,
    date: dayStr,
    platform: ca.platform,
    total_minutes: totalOnlineMinutes,
    unique_minutes: totalOnlineMinutes,
    free_chat_minutes: Math.round(granular.free_chat || 0),
    private_chat_minutes: Math.round(granular.private_chat || 0),
    nude_chat_minutes: Math.round(granular.nude_chat || 0),
    member_chat_minutes: Math.round(granular.member_chat || 0),
    group_chat_minutes: Math.round(granular.group_chat || 0),
    semiprivate_minutes: Math.round(granular.semiprivate || 0),
    vip_chat_minutes: Math.round(granular.vip_chat || 0),
    happy_hour_minutes: Math.round(granular.happy_hour || 0),
    party_chat_minutes: Math.round(granular.party_chat || 0),
    pre_gold_show_minutes: Math.round(granular.pre_gold_show || 0),
    gold_show_minutes: Math.round(granular.gold_show || 0),
    true_private_minutes: Math.round(granular.true_private || 0),
    paid_chat_minutes: Math.round(granular.paid_chat || 0),
    away_minutes: Math.round((granular.away || 0) + (granular.on_break || 0)),
    break_minutes: Math.round((granular.away || 0) + (granular.on_break || 0)),
  };

  // Upsert daily stats
  const { data: existing } = await admin
    .from("daily_stream_stats")
    .select("id")
    .eq("cam_account_id", ca.id)
    .eq("date", dayStr)
    .eq("platform", ca.platform)
    .maybeSingle();

  if (existing) {
    await admin.from("daily_stream_stats").update(statsData).eq("id", existing.id);
  } else {
    await admin.from("daily_stream_stats").insert(statsData);
  }

  // Upsert stream segments for today (only online segments, not offline)
  const segments: Record<string, unknown>[] = [];
  for (const act of activities) {
    const endTime = parseDate(act.created_at);
    if (!endTime) continue;
    const durationSec = act.seconds ?? 0;
    if (durationSec <= 0) continue;
    const startTime = new Date(endTime.getTime() - durationSec * 1000);
    const showType = ACTIVITY_TO_SHOW_TYPE[act.activity_status_id] ?? "unknown";

    // Skip offline entries
    if (!ONLINE_SHOW_TYPES.has(showType)) continue;

    const dayStart = new Date(dayStr + "T00:00:00Z");
    const dayEnd = new Date(dayStr + "T23:59:59.999Z");
    const s = startTime < dayStart ? dayStart : startTime;
    const e = endTime > dayEnd ? dayEnd : endTime;
    if (s >= e) continue;
    const durationMins = (e.getTime() - s.getTime()) / 60000;
    if (durationMins < 0.5) continue;

    segments.push({
      studio_id: ca.studio_id,
      model_id: ca.model_id,
      cam_account_id: ca.id,
      platform: ca.platform,
      date: dayStr,
      start_time: s.toISOString(),
      end_time: e.toISOString(),
      show_type: showType,
      duration_minutes: Math.round(durationMins * 100) / 100,
      source: "mycamgirlnet",
      tokens_earned: 0,
      usd_earned: 0,
    });
  }

  if (segments.length > 0) {
    // Delete existing segments for today (will be replaced)
    await admin
      .from("stream_segments")
      .delete()
      .eq("cam_account_id", ca.id)
      .eq("date", dayStr)
      .eq("source", "mycamgirlnet");

    // Insert in batches of 50
    for (let b = 0; b < segments.length; b += 50) {
      await admin.from("stream_segments").insert(segments.slice(b, b + 50));
    }
  }
}
