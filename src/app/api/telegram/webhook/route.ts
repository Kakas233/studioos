import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

/**
 * POST /api/telegram/webhook
 *
 * Receives updates from Telegram Bot API via webhook.
 * When a user sends /start {token}, this handler:
 * 1. Looks up the token in telegram_links
 * 2. Updates the record with the user's chat_id and username
 * 3. Sends a confirmation message back to the user
 */

const TELEGRAM_API = "https://api.telegram.org/bot";

function getAdminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function sendTelegramMessage(
  botToken: string,
  chatId: number | string,
  text: string
) {
  await fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
}

// Verify the request came from Telegram by checking the secret token header
function verifyTelegramRequest(request: NextRequest): boolean {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secret) return true; // If no secret configured, allow (for initial setup)
  const headerSecret = request.headers.get("x-telegram-bot-api-secret-token");
  return headerSecret === secret;
}

export async function POST(request: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }

  if (!verifyTelegramRequest(request)) {
    return NextResponse.json({ ok: true }); // Don't leak info, just ignore
  }

  try {
    const update = await request.json();

    // We only care about messages with /start command
    const message = update?.message;
    if (!message?.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat?.id;
    const username = message.from?.username || null;
    const text = message.text.trim();

    // Handle /start {token} deep link
    if (text.startsWith("/start ")) {
      const token = text.slice(7).trim();
      if (!token || token.length < 8) {
        await sendTelegramMessage(
          botToken,
          chatId,
          "Invalid connection link. Please generate a new link from StudioOS."
        );
        return NextResponse.json({ ok: true });
      }

      const adminDb = getAdminSupabase();

      // Look up the token
      const { data: link, error } = await (adminDb
        .from("telegram_links") as any)
        .select("id, account_id, studio_id, link_token, telegram_chat_id, is_active")
        .eq("link_token", token)
        .maybeSingle();

      if (error || !link) {
        await sendTelegramMessage(
          botToken,
          chatId,
          "Connection link not found or expired. Please generate a new link from StudioOS."
        );
        return NextResponse.json({ ok: true });
      }

      // Update with chat_id and username
      await (adminDb
        .from("telegram_links") as any)
        .update({
          telegram_chat_id: String(chatId),
          telegram_username: username,
          is_active: true,
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", link.id);

      await sendTelegramMessage(
        botToken,
        chatId,
        "✅ <b>Connected to StudioOS!</b>\n\nYou'll now receive member alerts and notifications here.\n\nYou can disconnect at any time from the StudioOS Member Alerts page."
      );

      return NextResponse.json({ ok: true });
    }

    // Handle plain /start (no token)
    if (text === "/start") {
      await sendTelegramMessage(
        botToken,
        chatId,
        "👋 <b>Welcome to StudioOS Alerts!</b>\n\nTo connect your account, go to the <b>Member Alerts</b> page in StudioOS and click <b>Connect Telegram Bot</b>."
      );
      return NextResponse.json({ ok: true });
    }

    // Handle /help
    if (text === "/help") {
      await sendTelegramMessage(
        botToken,
        chatId,
        "🤖 <b>StudioOS Alerts Bot</b>\n\nThis bot sends you real-time alerts from StudioOS:\n• Member online notifications\n• High-value tipper alerts\n• Studio notifications\n\nTo connect: Go to StudioOS → Member Alerts → Connect Telegram Bot"
      );
      return NextResponse.json({ ok: true });
    }

    // Any other message
    await sendTelegramMessage(
      botToken,
      chatId,
      "I'm the StudioOS Alerts bot. I send notifications — I don't process messages.\n\nType /help for more info."
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Telegram webhook error:", err);
    return NextResponse.json({ ok: true }); // Always 200 for Telegram
  }
}
