import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VPS_SECRET = process.env.VPS_INTERNAL_SECRET;
const TELEGRAM_API = "https://api.telegram.org/bot";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * POST /api/alerts/vps-webhook — Called by VPS when a member enters a monitored room.
 * Replaces the old Base44 `memberAlertWebhook` endpoint.
 *
 * VPS dispatcher sends:
 * - Header: `api_key` with WEBHOOK_SECRET value
 * - Payload: { site, room (modelUsername), member (memberUsername), amount }
 */
export async function POST(request: NextRequest) {
  // VPS sends secret as `api_key` header
  const secret = request.headers.get("api_key") || request.headers.get("x-internal-secret") || request.headers.get("x-webhook-secret");
  if (!VPS_SECRET || secret !== VPS_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // VPS sends: { site, room, member, amount }
    const site = body.site;
    const modelUsername = body.room || body.modelUsername;
    const memberUsername = body.member || body.memberUsername;
    const amount = body.amount || 0;

    if (!modelUsername || !memberUsername) {
      return NextResponse.json({ error: "Missing room or member" }, { status: 400 });
    }

    const adminDb = createAdminClient();

    // Look up the alert by model_username (VPS doesn't send the alert UUID)
    const { data: alert } = await adminDb
      .from("member_alerts")
      .select("id, studio_id, account_id, model_username, spending_threshold")
      .eq("model_username", modelUsername.toLowerCase())
      .eq("is_active", true)
      .limit(1)
      .single();

    if (!alert) {
      // Try case-insensitive match
      const { data: alertFallback } = await adminDb
        .from("member_alerts")
        .select("id, studio_id, account_id, model_username, spending_threshold")
        .ilike("model_username", modelUsername)
        .eq("is_active", true)
        .limit(1)
        .single();

      if (!alertFallback) {
        return NextResponse.json({ error: "No active alert for this model" }, { status: 404 });
      }

      return await deliverAlert(alertFallback, site, modelUsername, memberUsername, amount);
    }

    return await deliverAlert(alert, site, modelUsername, memberUsername, amount);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

async function deliverAlert(
  alert: { id: string; studio_id: string; spending_threshold: number; model_username: string },
  site: string,
  modelUsername: string,
  memberUsername: string,
  amount: number,
) {
  // Check spending threshold — amount 0 means VPS doesn't know spending,
  // so we pass it through and let the user see all entries
  // Only filter if amount > 0 AND below threshold
  if (amount > 0 && alert.spending_threshold > 0 && amount < alert.spending_threshold) {
    return NextResponse.json({ filtered: true, reason: "below_threshold" });
  }

  const adminDb = createAdminClient();

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

  const time = new Date().toLocaleTimeString("en-GB", { hour12: false, timeZone: "UTC" });
  const message = `🚨 <b>Member Alert</b>\n\n` +
    `👤 <b>${escapeHtml(memberUsername)}</b> entered ${escapeHtml(modelUsername)}'s room\n` +
    `🌐 Site: ${escapeHtml(site)}\n\n` +
    `⏰ ${time} UTC`;

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

  return NextResponse.json({ delivered: delivered > 0, count: delivered });
}
