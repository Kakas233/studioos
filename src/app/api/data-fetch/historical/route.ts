import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Activity Status ID -> exact show type name (from mycamgirl.net API)
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
  seconds?: number;
  activity_status_id: number;
}

interface Interval {
  start: Date;
  end: Date;
  showType: string;
  isOnline: boolean;
}

function parseDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  return new Date(dateStr.replace(" ", "T") + "Z");
}

function toDateStr(date: Date): string {
  return date.toISOString().split("T")[0];
}

function parseInterval(activity: Activity): Interval | null {
  const endTime = parseDate(activity.created_at);
  if (!endTime) return null;
  const durationSec = activity.seconds || 0;
  const startTime = new Date(endTime.getTime() - durationSec * 1000);
  const showType = ACTIVITY_TO_SHOW_TYPE[activity.activity_status_id] ?? "unknown";
  return { start: startTime, end: endTime, showType, isOnline: ONLINE_SHOW_TYPES.has(showType) };
}

function clipToDay(interval: { start: Date; end: Date }, dayStr: string) {
  const dayStart = new Date(dayStr + "T00:00:00Z");
  const dayEnd = new Date(dayStr + "T23:59:59.999Z");
  const s = interval.start < dayStart ? dayStart : interval.start;
  const e = interval.end > dayEnd ? dayEnd : interval.end;
  return s < e ? { start: s, end: e } : null;
}

function mergeIntervals(intervals: { start: Date; end: Date }[]) {
  if (intervals.length === 0) return [];
  const sorted = [...intervals].sort((a, b) => a.start.getTime() - b.start.getTime());
  const merged = [{ start: sorted[0].start, end: sorted[0].end }];
  for (let i = 1; i < sorted.length; i++) {
    const last = merged[merged.length - 1];
    if (sorted[i].start <= last.end) {
      if (sorted[i].end > last.end) last.end = sorted[i].end;
    } else {
      merged.push({ start: sorted[i].start, end: sorted[i].end });
    }
  }
  return merged;
}

function totalSeconds(intervals: { start: Date; end: Date }[]) {
  return intervals.reduce((sum, iv) => sum + (iv.end.getTime() - iv.start.getTime()) / 1000, 0);
}

function calcDayStats(activities: Activity[], dayStr: string) {
  const granular: Record<string, number> = {};
  const onlineIntervals: { start: Date; end: Date }[] = [];

  for (const act of activities) {
    const iv = parseInterval(act);
    if (!iv) continue;
    const clipped = clipToDay(iv, dayStr);
    if (!clipped) continue;
    const mins = (clipped.end.getTime() - clipped.start.getTime()) / 60000;
    granular[iv.showType] = (granular[iv.showType] || 0) + mins;
    if (iv.isOnline) onlineIntervals.push(clipped);
  }

  const merged = mergeIntervals(onlineIntervals);
  const onlineMins = Math.round(totalSeconds(merged) / 60);
  const rounded: Record<string, number> = {};
  for (const [k, v] of Object.entries(granular)) rounded[k] = Math.round(v);

  return { granular: rounded, total_online_minutes: onlineMins };
}

function buildStreamSegments(
  activities: Activity[],
  dayStr: string,
  camAccount: { id: string; studio_id: string; model_id: string; platform: string }
) {
  const segments: Record<string, unknown>[] = [];
  for (const act of activities) {
    const iv = parseInterval(act);
    if (!iv) continue;
    const clipped = clipToDay(iv, dayStr);
    if (!clipped) continue;
    const durationMins = (clipped.end.getTime() - clipped.start.getTime()) / 60000;
    if (durationMins < 0.5) continue;
    segments.push({
      studio_id: camAccount.studio_id,
      model_id: camAccount.model_id,
      cam_account_id: camAccount.id,
      platform: camAccount.platform,
      date: dayStr,
      start_time: clipped.start.toISOString(),
      end_time: clipped.end.toISOString(),
      show_type: iv.showType,
      duration_minutes: Math.round(durationMins * 100) / 100,
      source: "mycamgirlnet",
      tokens_earned: 0,
      usd_earned: 0,
    });
  }
  segments.sort((a, b) => new Date(a.start_time as string).getTime() - new Date(b.start_time as string).getTime());
  return segments;
}

async function fetchModelActivities(platform: string, username: string, page = 1) {
  const platformKey = PLATFORM_API_MAP[platform] || platform;
  const url = `https://api.mycamgirl.net/stats/${platformKey}/${username}/model-activities?page=${page}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      console.error(`API ${response.status} for ${platform}/${username} page ${page}`);
      return null;
    }
    return await response.json();
  } catch (err) {
    console.error(`Fetch error ${platform}/${username}:`, err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function randomDelay(minMs: number, maxMs: number) {
  return new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs)
  );
}

/**
 * POST /api/data-fetch/historical
 * Fetches 30 days of historical streaming data from mycamgirl.net API
 * for a given cam account. Creates/updates daily_stream_stats and stream_segments.
 *
 * Body: { cam_account_id: string, job_id: string }
 */
export async function POST(request: NextRequest) {
  const admin = createAdminClient();
  let jobId: string | null = null;

  try {
    // Auth check: must be logged in as admin/owner
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: account } = await supabase
      .from("accounts")
      .select("studio_id, role")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!account || !["owner", "admin"].includes(account.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { cam_account_id, job_id } = body;
    jobId = job_id;

    if (!cam_account_id || !job_id) {
      return NextResponse.json({ error: "Missing cam_account_id or job_id" }, { status: 400 });
    }

    // Fetch cam account using admin client (bypasses RLS)
    const { data: ca, error: caError } = await admin
      .from("cam_accounts")
      .select("id, studio_id, model_id, platform, username")
      .eq("id", cam_account_id)
      .single();

    if (caError || !ca) {
      return NextResponse.json({ error: "Cam account not found" }, { status: 404 });
    }

    // Mark job as in_progress
    await admin.from("data_fetch_jobs").update({
      status: "in_progress",
      started_at: new Date().toISOString(),
    }).eq("id", job_id);

    console.log(`Starting 30-day historical fetch for ${ca.platform}/${ca.username}`);

    // Fetch first page to get total pages
    const firstPageData = await fetchModelActivities(ca.platform, ca.username, 1);
    if (!firstPageData?.data?.length) {
      await admin.from("data_fetch_jobs").update({
        status: "completed",
        completed_at: new Date().toISOString(),
        pages_fetched: 0,
        total_pages: 0,
      }).eq("id", job_id);
      return NextResponse.json({ success: true, message: "No data available for this account" });
    }

    const lastPageNum = firstPageData.last_page || 1;
    console.log(`${ca.platform}/${ca.username}: ${lastPageNum} pages, ${firstPageData.total} activities`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const cutoffStr = toDateStr(cutoffDate);

    const pagesToFetch = Math.min(lastPageNum, 50);
    await admin.from("data_fetch_jobs").update({
      total_pages: pagesToFetch,
    }).eq("id", job_id);

    // Fetch pages from the end (most recent) going backwards
    let allActivities: Activity[] = [];
    let pagesFetched = 0;
    let reachedCutoff = false;

    for (let p = lastPageNum; p >= Math.max(1, lastPageNum - pagesToFetch + 1) && !reachedCutoff; p--) {
      let pageData;
      if (p === 1 && lastPageNum >= 1) {
        pageData = firstPageData;
      } else {
        await randomDelay(1500, 4000);
        pageData = await fetchModelActivities(ca.platform, ca.username, p);
      }

      if (pageData?.data) {
        allActivities.push(...pageData.data);
        for (const act of pageData.data) {
          const endTime = parseDate(act.created_at);
          if (endTime && endTime < cutoffDate) { reachedCutoff = true; break; }
        }
      }
      pagesFetched++;

      // Update progress every 3 pages
      if (pagesFetched % 3 === 0 || reachedCutoff) {
        await admin.from("data_fetch_jobs").update({
          pages_fetched: pagesFetched,
        }).eq("id", job_id);
      }
    }

    // Filter to only activities within 30-day window
    allActivities = allActivities.filter((act) => {
      const endTime = parseDate(act.created_at);
      return endTime && endTime >= cutoffDate;
    });

    console.log(`${allActivities.length} activities within 30-day window`);

    // Group activities by day
    const dayActivities: Record<string, Activity[]> = {};
    for (const act of allActivities) {
      const iv = parseInterval(act);
      if (!iv) continue;
      const startDay = toDateStr(iv.start);
      const endDay = toDateStr(iv.end);
      for (const d of new Set([startDay, endDay])) {
        if (d < cutoffStr) continue;
        if (!dayActivities[d]) dayActivities[d] = [];
        dayActivities[d].push(act);
      }
    }

    const daysToProcess = Object.keys(dayActivities).sort();
    let daysProcessed = 0;

    for (const dayStr of daysToProcess) {
      const acts = dayActivities[dayStr];
      const stats = calcDayStats(acts, dayStr);

      const statsData = {
        cam_account_id: ca.id,
        model_id: ca.model_id,
        studio_id: ca.studio_id,
        date: dayStr,
        platform: ca.platform,
        total_minutes: stats.total_online_minutes,
        unique_minutes: stats.total_online_minutes,
        free_chat_minutes: stats.granular.free_chat || 0,
        private_chat_minutes: stats.granular.private_chat || 0,
        nude_chat_minutes: stats.granular.nude_chat || 0,
        member_chat_minutes: stats.granular.member_chat || 0,
        group_chat_minutes: stats.granular.group_chat || 0,
        semiprivate_minutes: stats.granular.semiprivate || 0,
        vip_chat_minutes: stats.granular.vip_chat || 0,
        happy_hour_minutes: stats.granular.happy_hour || 0,
        party_chat_minutes: stats.granular.party_chat || 0,
        pre_gold_show_minutes: stats.granular.pre_gold_show || 0,
        gold_show_minutes: stats.granular.gold_show || 0,
        true_private_minutes: stats.granular.true_private || 0,
        paid_chat_minutes: stats.granular.paid_chat || 0,
        away_minutes: (stats.granular.away || 0) + (stats.granular.on_break || 0),
        break_minutes: (stats.granular.away || 0) + (stats.granular.on_break || 0),
      };

      // Upsert: check if stats already exist for this cam + date
      const { data: existing } = await admin
        .from("daily_stream_stats")
        .select("id")
        .eq("cam_account_id", ca.id)
        .eq("date", dayStr)
        .single();

      if (existing) {
        await admin.from("daily_stream_stats").update(statsData).eq("id", existing.id);
      } else {
        await admin.from("daily_stream_stats").insert(statsData);
      }

      // Save stream segments for this day
      try {
        const segmentsForDay = buildStreamSegments(acts, dayStr, ca);
        if (segmentsForDay.length > 0) {
          // Delete existing segments for this cam + date + source
          await admin
            .from("stream_segments")
            .delete()
            .eq("cam_account_id", ca.id)
            .eq("date", dayStr)
            .eq("source", "mycamgirlnet");

          // Insert in batches of 50
          for (let b = 0; b < segmentsForDay.length; b += 50) {
            await admin.from("stream_segments").insert(segmentsForDay.slice(b, b + 50));
          }
        }
      } catch (segErr) {
        console.error(`Segment save error ${dayStr}:`, segErr);
      }

      daysProcessed++;

      // Update progress every 5 days
      if (daysProcessed % 5 === 0) {
        await admin.from("data_fetch_jobs").update({
          pages_fetched: pagesFetched,
        }).eq("id", job_id);
      }
    }

    // Update live status from latest activity
    if (allActivities.length > 0) {
      const sortedByTime = [...allActivities].sort((a, b) =>
        (b.created_at || "").localeCompare(a.created_at || "")
      );
      const latest = sortedByTime[0];
      const latestShowType = ACTIVITY_TO_SHOW_TYPE[latest.activity_status_id] ?? "offline";
      const latestEndTime = parseDate(latest.created_at);
      const now = new Date();
      const isLive = ONLINE_SHOW_TYPES.has(latestShowType)
        && !!latestEndTime
        && (now.getTime() - latestEndTime.getTime()) <= 2 * 60 * 1000;

      // Upsert streaming session
      const { data: existingSession } = await admin
        .from("streaming_sessions")
        .select("id")
        .eq("cam_account_id", ca.id)
        .single();

      const sessionData = {
        studio_id: ca.studio_id,
        cam_account_id: ca.id,
        is_currently_live: isLive,
        show_type: (isLive ? latestShowType : "offline") as "free_chat" | "private_chat" | "offline",
        scraped_at: new Date().toISOString(),
      };

      if (existingSession) {
        await admin.from("streaming_sessions").update(sessionData).eq("id", existingSession.id);
      } else {
        await admin.from("streaming_sessions").insert(sessionData);
      }
    }

    // Mark job as completed
    await admin.from("data_fetch_jobs").update({
      status: "completed",
      completed_at: new Date().toISOString(),
      pages_fetched: pagesFetched,
      total_pages: pagesToFetch,
    }).eq("id", job_id);

    console.log(`Completed 30-day historical fetch for ${ca.platform}/${ca.username}: ${daysProcessed} days processed`);

    return NextResponse.json({
      success: true,
      pages_fetched: pagesFetched,
      days_processed: daysProcessed,
    });
  } catch (error) {
    console.error("fetchHistoricalData error:", error);
    if (jobId) {
      try {
        await admin.from("data_fetch_jobs").update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error",
        }).eq("id", jobId);
      } catch (e) {
        console.error("Failed to update job status:", e);
      }
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
