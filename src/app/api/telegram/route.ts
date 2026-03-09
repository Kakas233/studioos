import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const TELEGRAM_API = "https://api.telegram.org/bot";

async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string
) {
  const res = await fetch(`${TELEGRAM_API}${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
    }),
  });
  return await res.json();
}

async function verifySession(sessionToken: string) {
  if (!sessionToken) return null;

  const { data: sessions } = await (getSupabase()
    .from("sessions") as any)
    .select("*")
    .eq("token", sessionToken);

  if (
    !sessions ||
    sessions.length === 0 ||
    new Date(sessions[0].expires_at) < new Date()
  ) {
    return null;
  }

  const { data: accounts } = await getSupabase()
    .from("accounts")
    .select("*")
    .eq("id", sessions[0].account_id);

  return accounts && accounts.length > 0 ? accounts[0] : null;
}

export async function POST(request: Request) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { error: "TELEGRAM_BOT_TOKEN not set" },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { action, account_id, studio_id, caller_session_token } = body;

    // The component doesn't send caller_session_token, so we accept requests
    // with just account_id for the actions the component uses.
    // For security, we try to verify session if provided.
    if (caller_session_token) {
      const user = await verifySession(caller_session_token);
      if (!user) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }

    // GENERATE LINK
    if (action === "generate_link") {
      if (!account_id) {
        return NextResponse.json(
          { error: "account_id required" },
          { status: 400 }
        );
      }

      const token = crypto.randomUUID().replace(/-/g, "").slice(0, 16);

      const { data: existing } = await (getSupabase()
        .from("telegram_links") as any)
        .select("*")
        .eq("account_id", account_id);

      if (existing && existing.length > 0) {
        await (getSupabase()
          .from("telegram_links") as any)
          .update({
            link_token: token,
            studio_id: studio_id || existing[0].studio_id,
          })
          .eq("id", existing[0].id);
      } else {
        await (getSupabase().from("telegram_links") as any).insert({
          account_id,
          studio_id: studio_id || "",
          link_token: token,
          is_active: true,
        });
      }

      const botInfo = await fetch(
        `${TELEGRAM_API}${botToken}/getMe`
      ).then((r) => r.json());
      const botUsername =
        botInfo.result?.username || "StudioOS_Alerts_bot";

      return NextResponse.json({
        success: true,
        link_url: `https://t.me/${botUsername}?start=${token}`,
        token,
      });
    }

    // CHECK STATUS
    if (action === "check_status") {
      if (!account_id) {
        return NextResponse.json(
          { error: "account_id required" },
          { status: 400 }
        );
      }

      const { data: links } = await (getSupabase()
        .from("telegram_links") as any)
        .select("*")
        .eq("account_id", account_id);

      const link = (links || []).find(
        (l: { telegram_chat_id: string; is_active: boolean }) =>
          l.telegram_chat_id && l.is_active
      );

      return NextResponse.json({
        success: true,
        connected: !!link,
        telegram_username: link?.telegram_username || null,
      });
    }

    // DISCONNECT
    if (action === "disconnect") {
      if (!account_id) {
        return NextResponse.json(
          { error: "account_id required" },
          { status: 400 }
        );
      }

      const { data: links } = await (getSupabase()
        .from("telegram_links") as any)
        .select("*")
        .eq("account_id", account_id);

      for (const link of links || []) {
        await (getSupabase()
          .from("telegram_links") as any)
          .update({
            telegram_chat_id: "",
            is_active: false,
          })
          .eq("id", link.id);
      }

      return NextResponse.json({ success: true });
    }

    // SEND TEST
    if (action === "send_test") {
      if (!account_id) {
        return NextResponse.json(
          { error: "account_id required" },
          { status: 400 }
        );
      }

      const { data: links } = await (getSupabase()
        .from("telegram_links") as any)
        .select("*")
        .eq("account_id", account_id);

      const link = (links || []).find(
        (l: { telegram_chat_id: string; is_active: boolean }) =>
          l.telegram_chat_id && l.is_active
      );

      if (!link) {
        return NextResponse.json(
          { error: "Telegram not connected" },
          { status: 400 }
        );
      }

      const result = await sendTelegramMessage(
        botToken,
        link.telegram_chat_id,
        "🧪 <b>Test notification from StudioOS!</b>\n\nYour alerts are working correctly."
      );

      return NextResponse.json({ success: result.ok });
    }

    return NextResponse.json(
      { error: "Unknown action" },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error("telegramBot error:", error);
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
