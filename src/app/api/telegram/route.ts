import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

function getAdminSupabase() {
  return createAdminClient(
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

export async function POST(request: Request) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { error: "TELEGRAM_BOT_TOKEN not set" },
        { status: 500 }
      );
    }

    // Authenticate the user via Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: callerAccount } = await supabase
      .from("accounts")
      .select("id, studio_id, role")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!callerAccount) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { action, account_id, studio_id } = body;

    // Verify account_id belongs to same studio
    const targetAccountId = account_id || callerAccount.id;
    if (targetAccountId !== callerAccount.id) {
      // Only owner/admin can manage other accounts' telegram
      if (!["owner", "admin"].includes(callerAccount.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      // Verify target account is in same studio
      const { data: targetAccount } = await supabase
        .from("accounts")
        .select("studio_id")
        .eq("id", targetAccountId)
        .single();

      if (!targetAccount || targetAccount.studio_id !== callerAccount.studio_id) {
        return NextResponse.json({ error: "Account not found" }, { status: 404 });
      }
    }

    const adminDb = getAdminSupabase();
    const studioId = studio_id || callerAccount.studio_id;

    // GENERATE LINK
    if (action === "generate_link") {
      const token = crypto.randomUUID().replace(/-/g, "").slice(0, 16);

      const { data: existing } = await (adminDb
        .from("telegram_links") as any)
        .select("*")
        .eq("account_id", targetAccountId);

      if (existing && existing.length > 0) {
        await (adminDb
          .from("telegram_links") as any)
          .update({
            link_token: token,
            studio_id: studioId,
          })
          .eq("id", existing[0].id);
      } else {
        await (adminDb.from("telegram_links") as any).insert({
          account_id: targetAccountId,
          studio_id: studioId,
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
      const { data: links } = await (adminDb
        .from("telegram_links") as any)
        .select("*")
        .eq("account_id", targetAccountId);

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
      const { data: links } = await (adminDb
        .from("telegram_links") as any)
        .select("*")
        .eq("account_id", targetAccountId);

      for (const link of links || []) {
        await (adminDb
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
      const { data: links } = await (adminDb
        .from("telegram_links") as any)
        .select("*")
        .eq("account_id", targetAccountId);

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
