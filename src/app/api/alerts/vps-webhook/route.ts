import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VPS_SECRET = process.env.VPS_INTERNAL_SECRET;
const TELEGRAM_API = "https://api.telegram.org/bot";
const STATBATE_API = "https://plus.statbate.com/api";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Format number with commas: 10226 → "10,226" */
function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

/** Capitalize first letter of site name */
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

/** Fetch member spending data from Statbate API */
async function fetchMemberSpending(
  site: string,
  memberUsername: string,
): Promise<{ allTime: number; threeMonths: number; lastMonth: number } | null> {
  const apiToken = process.env.STATBATE_API_TOKEN;
  if (!apiToken) return null;

  try {
    // Fetch member info (contains all-time spending)
    const infoRes = await fetch(
      `${STATBATE_API}/members/${site}/${memberUsername}/info?timezone=UTC`,
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

    const allTimeTokens = infoData?.data?.all_time_tokens ?? 0;

    // Fetch activity for 3-month and 1-month breakdowns
    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    // 3 month tips
    const tips3Res = await fetch(
      `${STATBATE_API}/members/${site}/${memberUsername}/tips?timezone=UTC&range[0]=${formatDate(threeMonthsAgo)}&range[1]=${formatDate(now)}&per_page=1`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(8000),
      },
    );

    let threeMonthTokens = 0;
    if (tips3Res.ok) {
      const tips3Data = await tips3Res.json();
      threeMonthTokens = tips3Data?.meta?.total_tokens ?? 0;
    }

    // 1 month tips
    const tips1Res = await fetch(
      `${STATBATE_API}/members/${site}/${memberUsername}/tips?timezone=UTC&range[0]=${formatDate(oneMonthAgo)}&range[1]=${formatDate(now)}&per_page=1`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(8000),
      },
    );

    let lastMonthTokens = 0;
    if (tips1Res.ok) {
      const tips1Data = await tips1Res.json();
      lastMonthTokens = tips1Data?.meta?.total_tokens ?? 0;
    }

    return {
      allTime: allTimeTokens,
      threeMonths: threeMonthTokens,
      lastMonth: lastMonthTokens,
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

    const adminDb = createAdminClient();

    // Look up the alert by model_username
    let alert = await adminDb
      .from("member_alerts")
      .select("id, studio_id, account_id, model_username, spending_threshold")
      .eq("model_username", modelUsername.toLowerCase())
      .eq("is_active", true)
      .limit(1)
      .single()
      .then(r => r.data);

    if (!alert) {
      // Try case-insensitive match
      alert = await adminDb
        .from("member_alerts")
        .select("id, studio_id, account_id, model_username, spending_threshold")
        .ilike("model_username", modelUsername)
        .eq("is_active", true)
        .limit(1)
        .single()
        .then(r => r.data);
    }

    if (!alert) {
      return NextResponse.json({ error: "No active alert for this model" }, { status: 404 });
    }

    // Fetch spending data from Statbate API
    const spending = await fetchMemberSpending(site, memberUsername);

    // Apply spending threshold filter using all-time tokens converted to USD
    const SITE_TOKEN_RATES: Record<string, number> = {
      livejasmin: 1.0, bongacams: 0.02, cam4: 0.1, flirt4free: 0.03,
      myfreecams: 0.05, chaturbate: 0.05, stripchat: 0.05, camsoda: 0.05,
    };
    const tokenRate = SITE_TOKEN_RATES[site.toLowerCase()] ?? 0.05;
    const allTimeUsd = spending ? Math.round(spending.allTime * tokenRate) : 0;

    if (spending && alert.spending_threshold > 0 && allTimeUsd < alert.spending_threshold) {
      return NextResponse.json({ filtered: true, reason: "below_threshold", allTimeUsd });
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

    // Build message matching the old alert format
    const siteName = capSite(site);
    let message: string;

    if (spending && spending.allTime > 0) {
      const threeMonthUsd = Math.round(spending.threeMonths * tokenRate);
      const lastMonthUsd = Math.round(spending.lastMonth * tokenRate);

      message =
        `🔔 Spender in ${escapeHtml(modelUsername)}'s room (${escapeHtml(siteName)})\n\n` +
        `👤 <b>${escapeHtml(memberUsername)}</b> just entered\n\n` +
        `All-time:    ${fmt(spending.allTime)} tk ($${fmt(allTimeUsd)})\n` +
        `3 months:   ${fmt(spending.threeMonths)} tk ($${fmt(threeMonthUsd)})\n` +
        `Last month: ${fmt(spending.lastMonth)} tk ($${fmt(lastMonthUsd)})\n\n` +
        `<i>(min $${fmt(alert.spending_threshold)})</i>`;
    } else {
      // No spending data available — still send alert
      message =
        `🔔 Member in ${escapeHtml(modelUsername)}'s room (${escapeHtml(siteName)})\n\n` +
        `👤 <b>${escapeHtml(memberUsername)}</b> just entered\n\n` +
        `<i>Spending data unavailable</i>`;
    }

    // Send to all connected Telegram accounts in this studio
    let delivered = 0;
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
        if (res.ok) delivered++;
      } catch {
        // Continue delivering to other accounts
      }
    }

    return NextResponse.json({ delivered: delivered > 0, count: delivered, allTimeUsd });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
