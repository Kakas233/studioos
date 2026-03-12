import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { timingSafeEqual } from "crypto";

const TELEGRAM_API = "https://api.telegram.org/bot";

/**
 * Send a Telegram message to all super admins that have Telegram connected.
 */
async function sendToSuperAdmins(
  admin: ReturnType<typeof createAdminClient>,
  botToken: string,
  message: string
): Promise<{ sent: boolean; count: number }> {
  // Find super admin accounts
  const { data: superAdmins } = await admin
    .from("accounts")
    .select("id, email")
    .eq("is_super_admin", true)
    .eq("is_active", true);

  if (!superAdmins || superAdmins.length === 0) {
    console.error("No active super admin accounts found");
    return { sent: false, count: 0 };
  }

  const adminIds = superAdmins.map((a) => a.id);

  // Get telegram links for these admins
  const { data: telegramLinks } = await admin
    .from("telegram_links")
    .select("account_id, telegram_chat_id")
    .in("account_id", adminIds)
    .eq("is_active", true)
    .not("telegram_chat_id", "is", null) as { data: { account_id: string; telegram_chat_id: string }[] | null };

  if (!telegramLinks || telegramLinks.length === 0) {
    return { sent: false, count: 0 };
  }

  let delivered = 0;
  for (const link of telegramLinks) {
    if (!link.telegram_chat_id) continue;
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
      const result = await res.json();
      if (result.ok) delivered++;
      else console.error(`Telegram send failed for account ${link.account_id}:`, JSON.stringify(result));
    } catch (err) {
      console.error(`Telegram send error:`, err);
    }
  }

  return { sent: delivered > 0, count: delivered };
}

function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${cronSecret}`;
  if (authHeader.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
}

/**
 * GET /api/cron/admin-telegram-notify?action=daily_summary
 * Called by Vercel Cron. Supports: daily_summary, payout_reminder.
 */
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const action = request.nextUrl.searchParams.get("action") || "daily_summary";
  return handleAction(request, { action });
}

/**
 * POST /api/cron/admin-telegram-notify
 * Called programmatically with full params.
 * Body: { action: "daily_summary" | "payout_reminder" | "new_registration" | "subscription_event", ...params }
 */
export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  return handleAction(request, body);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleAction(_request: NextRequest, body: Record<string, any>) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not set" }, { status: 500 });
  }

  try {
    const { action } = body;
    const admin = createAdminClient();

    // ── Daily Summary ──
    if (action === "daily_summary") {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      // Get all studios
      const { data: allStudios } = await admin
        .from("studios")
        .select("id, name, subscription_status, subscription_tier, created_at");

      const studios = allStudios || [];

      // Count subscription statuses
      const active = studios.filter((s) => s.subscription_status === "active").length;
      const trialing = studios.filter((s) => s.subscription_status === "trialing").length;
      const suspended = studios.filter((s) => s.subscription_status === "suspended").length;
      const gracePeriod = studios.filter((s) => s.subscription_status === "grace_period").length;
      const cancelled = studios.filter((s) => s.subscription_status === "cancelled").length;

      // New studios created yesterday
      const newStudios = studios.filter((s) => {
        const created = s.created_at?.split("T")[0];
        return created === yesterdayStr;
      });

      // Count by tier
      const tiers: Record<string, number> = { starter: 0, pro: 0, elite: 0, free: 0 };
      studios.forEach((s) => {
        const t = s.subscription_tier || "free";
        tiers[t] = (tiers[t] || 0) + 1;
      });

      // Get all active accounts for total counts
      const { data: allAccounts } = await admin
        .from("accounts")
        .select("role")
        .eq("is_active", true);

      const accounts = allAccounts || [];
      const totalModels = accounts.filter((a) => a.role === "model").length;
      const totalOperators = accounts.filter((a) => a.role === "operator").length;

      let msg =
        `📊 <b>StudioOS Daily Summary</b>\n` +
        `📅 ${yesterdayStr}\n` +
        `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n` +
        `🏢 <b>Studios: ${studios.length}</b>\n` +
        `   ✅ Active: ${active}\n` +
        `   🆓 Trialing: ${trialing}\n` +
        `   ⏳ Grace Period: ${gracePeriod}\n` +
        `   ❌ Suspended: ${suspended}\n` +
        `   🚫 Cancelled: ${cancelled}\n\n` +
        `📦 <b>By Plan:</b>\n` +
        `   🟢 Elite: ${tiers.elite}\n` +
        `   🔵 Pro: ${tiers.pro}\n` +
        `   🟡 Starter: ${tiers.starter}\n` +
        `   ⚪ Free/Trial: ${tiers.free}\n\n` +
        `👥 <b>Total Users:</b> ${accounts.length}\n` +
        `   🎭 Models: ${totalModels} | 🎮 Operators: ${totalOperators}\n\n`;

      if (newStudios.length > 0) {
        msg +=
          `🆕 <b>New Studios Yesterday (${newStudios.length}):</b>\n` +
          newStudios.map((s) => `   • ${s.name} (${s.subscription_tier || "trial"})`).join("\n") +
          "\n\n";
      } else {
        msg += `📭 No new studios yesterday\n\n`;
      }

      msg += `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`;

      const result = await sendToSuperAdmins(admin, botToken, msg);
      return NextResponse.json({ success: true, action: "daily_summary", ...result });
    }

    // ── Payout Reminder ──
    if (action === "payout_reminder") {
      const { data: activeStudios } = await admin
        .from("studios")
        .select("id, name, payout_frequency")
        .eq("subscription_status", "active");

      const reminders: string[] = [];
      const now = new Date();
      const dayOfMonth = now.getUTCDate();
      const dayOfWeek = now.getUTCDay(); // 0 = Sunday

      for (const studio of activeStudios || []) {
        const freq = studio.payout_frequency || "biweekly";
        let needsReminder = false;

        if (freq === "weekly" && dayOfWeek === 0) needsReminder = true;
        if (freq === "biweekly" && (dayOfMonth === 1 || dayOfMonth === 15)) needsReminder = true;
        if (freq === "monthly" && dayOfMonth === 1) needsReminder = true;

        if (needsReminder) {
          reminders.push(studio.name);
        }
      }

      if (reminders.length > 0) {
        const msg =
          `💸 <b>Payout Reminder</b>\n\n` +
          `The following studios have payouts due:\n\n` +
          reminders.map((n) => `   • ${n}`).join("\n") +
          "\n\n" +
          `<i>Don't forget to process payouts!</i>`;

        const result = await sendToSuperAdmins(admin, botToken, msg);
        return NextResponse.json({
          success: true,
          action: "payout_reminder",
          studios_reminded: reminders.length,
          ...result,
        });
      }

      return NextResponse.json({
        success: true,
        action: "payout_reminder",
        sent: false,
        message: "No payouts due today",
      });
    }

    // ── New Registration Alert ──
    if (action === "new_registration") {
      const { studio_name, email, tier, subdomain } = body;

      const msg =
        `🆕 <b>New Studio Registration!</b>\n\n` +
        `🏢 <b>${studio_name || "Unknown"}</b>\n` +
        `📧 ${email || "N/A"}\n` +
        `📦 Plan: ${(tier || "free").toUpperCase()}\n` +
        `🔗 Subdomain: ${subdomain || "N/A"}\n` +
        `🕐 ${new Date().toISOString().replace("T", " ").split(".")[0]} UTC`;

      const result = await sendToSuperAdmins(admin, botToken, msg);
      return NextResponse.json({ success: true, action: "new_registration", ...result });
    }

    // ── Subscription Event Alert ──
    if (action === "subscription_event") {
      const { event_type, studio_name, tier, details } = body;

      const eventEmojis: Record<string, string> = {
        payment_failed: "🔴",
        payment_succeeded: "💰",
        subscription_created: "🎉",
        subscription_cancelled: "🚫",
        subscription_updated: "🔄",
        trial_expired: "⏰",
        grace_period_started: "⚠️",
        studio_suspended: "🛑",
      };

      const emoji = eventEmojis[event_type] || "📢";
      const msg =
        `${emoji} <b>Subscription Event</b>\n\n` +
        `🏢 <b>${studio_name || "Unknown Studio"}</b>\n` +
        `📌 Event: <b>${(event_type || "unknown").replace(/_/g, " ").toUpperCase()}</b>\n` +
        (tier ? `📦 Plan: ${tier.toUpperCase()}\n` : "") +
        (details ? `📝 ${details}\n` : "") +
        `🕐 ${new Date().toISOString().replace("T", " ").split(".")[0]} UTC`;

      const result = await sendToSuperAdmins(admin, botToken, msg);
      return NextResponse.json({ success: true, action: "subscription_event", ...result });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("adminTelegramNotify error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
