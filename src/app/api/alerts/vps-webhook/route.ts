import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveStatbateSite, getTokenRate } from "@/lib/platforms";

const VPS_SECRET = process.env.VPS_INTERNAL_SECRET;
const TELEGRAM_API = "https://api.telegram.org/bot";
const STATBATE_API = "https://plus.statbate.com/api";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

function capSite(site: string): string {
  const names: Record<string, string> = {
    myfreecams: "Myfreecams",
    chaturbate: "Chaturbate",
    stripchat: "Stripchat",
    camsoda: "Camsoda",
    bongacams: "Bongacams",
    livejasmin: "LiveJasmin",
  };
  return names[site.toLowerCase()] || site;
}

function formatDateUTC(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d} 00:00:00`;
}

/** Fetch period tokens using /top-models endpoint and summing total_tokens */
async function fetchPeriodTokens(
  apiToken: string,
  statbateSite: string,
  username: string,
  rangeStart: string,
  rangeEnd: string,
): Promise<number> {
  try {
    const params = new URLSearchParams({
      "range[0]": rangeStart,
      "range[1]": rangeEnd,
    });
    const res = await fetch(
      `${STATBATE_API}/members/${statbateSite}/${username}/top-models?${params}`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!res.ok) return 0;

    const data = await res.json();
    const models = data?.data || [];
    let totalTokens = 0;
    for (const m of models) {
      totalTokens += (m.total_tokens || 0);
    }
    return totalTokens;
  } catch {
    return 0;
  }
}

interface SpendingData {
  allTimeTokens: number;
  allTimeUsd: number;
  threeMonthTokens: number;
  threeMonthUsd: number;
  oneMonthTokens: number;
  oneMonthUsd: number;
}

/** Fetch member spending from Statbate — matches old Base44 getMemberSpending */
async function getMemberSpending(
  site: string,
  memberUsername: string,
): Promise<SpendingData | null> {
  const apiToken = process.env.STATBATE_API_TOKEN;
  if (!apiToken) return null;

  const statbateSite = resolveStatbateSite(site);
  if (!statbateSite) return null;
  const tokenRate = getTokenRate(statbateSite);

  try {
    // Fetch member info (all-time tokens)
    const infoRes = await fetch(
      `${STATBATE_API}/members/${statbateSite}/${memberUsername}/info?timezone=UTC`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!infoRes.ok) return null;
    const infoData = await infoRes.json();
    const memberData = infoData?.data;
    if (!memberData) return null;

    const allTimeTokens = memberData.all_time_tokens || 0;
    const allTimeUsd = allTimeTokens * tokenRate;

    // Calculate date ranges
    const now = new Date();
    const nowStr = formatDateUTC(now);

    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setUTCMonth(threeMonthsAgo.getUTCMonth() - 3);
    const threeMonthStr = formatDateUTC(threeMonthsAgo);

    const oneMonthAgo = new Date(now);
    oneMonthAgo.setUTCMonth(oneMonthAgo.getUTCMonth() - 1);
    const oneMonthStr = formatDateUTC(oneMonthAgo);

    // Fetch 3-month and 1-month spending in parallel using /top-models endpoint
    const [threeMonthTokens, oneMonthTokens] = await Promise.all([
      fetchPeriodTokens(apiToken, statbateSite, memberUsername, threeMonthStr, nowStr),
      fetchPeriodTokens(apiToken, statbateSite, memberUsername, oneMonthStr, nowStr),
    ]);

    const threeMonthUsd = threeMonthTokens * tokenRate;
    const oneMonthUsd = oneMonthTokens * tokenRate;

    return {
      allTimeTokens,
      allTimeUsd,
      threeMonthTokens,
      threeMonthUsd,
      oneMonthTokens,
      oneMonthUsd,
    };
  } catch (err) {
    console.error("[VPS-Webhook] Statbate API error:", err);
    return null;
  }
}

/**
 * POST /api/alerts/vps-webhook — Called by VPS when a member enters a monitored room.
 *
 * VPS dispatcher sends:
 * - Header: `api_key` with WEBHOOK_SECRET value
 * - Payload: { site, room (modelUsername), member (memberUsername), amount }
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get("api_key") || request.headers.get("x-internal-secret") || request.headers.get("x-webhook-secret");
  if (!VPS_SECRET || secret !== VPS_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const site = body.site;
    const modelUsername = body.room || body.modelUsername;
    const memberUsername = body.member || body.memberUsername;

    if (!modelUsername || !memberUsername) {
      return NextResponse.json({ error: "Missing room or member" }, { status: 400 });
    }

    // Validate site name against known platforms
    if (!site || !resolveStatbateSite(site)) {
      console.error(`[VPS-Webhook] Unknown site: "${site}"`);
      return NextResponse.json({ error: `Unknown site: ${site}` }, { status: 400 });
    }

    const adminDb = createAdminClient();

    // Look up the alert by model_username — use maybeSingle to avoid throwing on no match
    let alert = await adminDb
      .from("member_alerts")
      .select("id, studio_id, account_id, model_username, spending_threshold")
      .eq("model_username", modelUsername.toLowerCase())
      .eq("is_active", true)
      .limit(1)
      .maybeSingle()
      .then(r => r.data);

    if (!alert) {
      // Case-insensitive fallback
      alert = await adminDb
        .from("member_alerts")
        .select("id, studio_id, account_id, model_username, spending_threshold")
        .ilike("model_username", modelUsername)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle()
        .then(r => r.data);
    }

    if (!alert) {
      return NextResponse.json({ error: "No active alert for this model" }, { status: 404 });
    }

    // Fetch spending data from Statbate API
    const spending = await getMemberSpending(site, memberUsername);
    const threshold = alert.spending_threshold ?? 0;

    // If threshold is set: only alert if spending data exists AND meets threshold
    if (threshold > 0) {
      if (!spending) {
        console.error(`[VPS-Webhook] Statbate API returned no data for ${memberUsername} on ${site}`);
        return NextResponse.json({
          filtered: true,
          reason: "statbate_api_error",
          member: memberUsername,
          site,
        });
      }
      if (spending.allTimeUsd < threshold) {
        return NextResponse.json({
          filtered: true,
          reason: "below_threshold",
          allTimeUsd: spending.allTimeUsd,
          threshold,
        });
      }
    }

    // Find Telegram chat IDs for this studio
    const { data: telegramLinks } = await adminDb
      .from("telegram_links")
      .select("telegram_chat_id, account_id")
      .eq("studio_id", alert.studio_id)
      .not("telegram_chat_id", "is", null) as { data: { telegram_chat_id: string; account_id: string }[] | null };

    if (!telegramLinks || telegramLinks.length === 0) {
      return NextResponse.json({ delivered: false, reason: "no_telegram_links" });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ delivered: false, reason: "no_bot_token" });
    }

    // Build message matching the old Base44 alert format
    const siteName = capSite(site);
    let message: string;

    if (spending && spending.allTimeTokens > 0) {
      message =
        `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n` +
        `🔔 <b>Spender in ${escapeHtml(modelUsername)}'s room</b> (${escapeHtml(siteName)})\n\n` +
        `👤 <b>${escapeHtml(memberUsername)}</b> just entered\n\n` +
        `All-time:      ${fmt(spending.allTimeTokens)} tk ($${fmt(Math.round(spending.allTimeUsd))})\n` +
        `3 months:      ${fmt(spending.threeMonthTokens)} tk ($${fmt(Math.round(spending.threeMonthUsd))})\n` +
        `Last month:   ${fmt(spending.oneMonthTokens)} tk ($${fmt(Math.round(spending.oneMonthUsd))})\n\n` +
        `<i>(min $${fmt(threshold)})</i>`;
    } else {
      message =
        `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n` +
        `🔔 Member in ${escapeHtml(modelUsername)}'s room (${escapeHtml(siteName)})\n\n` +
        `👤 <b>${escapeHtml(memberUsername)}</b> just entered\n\n` +
        `<i>Spending data unavailable</i>`;
    }

    // Send to all connected Telegram accounts in this studio
    let delivered = 0;
    let failed = 0;
    for (const link of telegramLinks) {
      try {
        const res = await fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: link.telegram_chat_id,
            text: message,
            parse_mode: "HTML",
          }),
          signal: AbortSignal.timeout(10000),
        });
        if (res.ok) {
          delivered++;
        } else {
          failed++;
          console.error(`[VPS-Webhook] Telegram send failed for chat_id ${link.telegram_chat_id}: ${res.status}`);
        }
      } catch (err) {
        failed++;
        console.error(`[VPS-Webhook] Telegram send error for chat_id ${link.telegram_chat_id}:`, err);
      }
    }

    return NextResponse.json({
      delivered: delivered > 0,
      count: delivered,
      failed,
      allTimeUsd: spending?.allTimeUsd ?? 0,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
