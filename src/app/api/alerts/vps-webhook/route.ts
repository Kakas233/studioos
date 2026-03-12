import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const VPS_SECRET = process.env.VPS_INTERNAL_SECRET;
const TELEGRAM_API = "https://api.telegram.org/bot";

/**
 * POST /api/alerts/vps-webhook — Called by VPS when a member enters a monitored room.
 * Replaces the old Base44 `memberAlertWebhook` endpoint.
 *
 * Expected payload from VPS:
 * {
 *   site: string,
 *   modelUsername: string,
 *   modelId: string (alert UUID),
 *   memberUsername: string,
 *   alertType: string,
 *   spendingData?: { total: number, sites: Record<string, number> },
 *   timestamp: string
 * }
 */
export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-internal-secret") || request.headers.get("x-webhook-secret");
  if (!VPS_SECRET || secret !== VPS_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { site, modelUsername, modelId, memberUsername, spendingData } = body;

    if (!modelId || !memberUsername) {
      return NextResponse.json({ error: "Missing modelId or memberUsername" }, { status: 400 });
    }

    const adminDb = createAdminClient();

    // Look up the alert to find which studio/account it belongs to
    const { data: alert } = await adminDb
      .from("member_alerts")
      .select("id, studio_id, account_id, model_username, spending_threshold")
      .eq("id", modelId)
      .eq("is_active", true)
      .single();

    if (!alert) {
      return NextResponse.json({ error: "Alert not found or inactive" }, { status: 404 });
    }

    // Check spending threshold
    const totalSpending = spendingData?.total ?? 0;
    if (alert.spending_threshold > 0 && totalSpending < alert.spending_threshold) {
      return NextResponse.json({ filtered: true, reason: "below_threshold" });
    }

    // Find Telegram chat IDs for this studio's accounts that have Telegram connected
    const { data: telegramLinks } = await adminDb
      .from("telegram_links")
      .select("telegram_chat_id, account_id")
      .eq("studio_id", alert.studio_id)
      .not("telegram_chat_id", "is", null);

    if (!telegramLinks || telegramLinks.length === 0) {
      return NextResponse.json({ delivered: false, reason: "no_telegram_links" });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ delivered: false, reason: "no_bot_token" });
    }

    // Build alert message
    const spendingLine = totalSpending > 0
      ? `\n💰 Total spending: $${totalSpending.toLocaleString()}`
      : "";

    const siteBreakdown = spendingData?.sites
      ? Object.entries(spendingData.sites as Record<string, number>)
          .filter(([, amount]) => amount > 0)
          .map(([s, amount]) => `  • ${s}: $${amount.toLocaleString()}`)
          .join("\n")
      : "";

    const breakdownLine = siteBreakdown ? `\n📊 Breakdown:\n${siteBreakdown}` : "";

    const message = `🚨 *Member Alert*\n\n` +
      `👤 *${memberUsername}* entered ${modelUsername}'s room\n` +
      `🌐 Site: ${site}${spendingLine}${breakdownLine}\n\n` +
      `⏰ ${new Date().toLocaleTimeString("en-GB", { hour12: false, timeZone: "UTC" })} UTC`;

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
            parse_mode: "Markdown",
          }),
          signal: AbortSignal.timeout(10000),
        });
        if (res.ok) delivered++;
      } catch {
        // Continue delivering to other accounts
      }
    }

    return NextResponse.json({ delivered: delivered > 0, count: delivered });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
