import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/chat?channel_id=xxx — Get messages for a channel */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get("channel_id");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const before = searchParams.get("before"); // cursor-based pagination

    if (!channelId) {
      return NextResponse.json({ error: "channel_id required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: account } = await supabase
      .from("accounts")
      .select("studio_id")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!account) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Verify the channel belongs to this studio
    const { data: channel } = await supabase
      .from("chat_channels")
      .select("id")
      .eq("id", channelId)
      .eq("studio_id", account.studio_id)
      .single();

    if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

    let query = supabase
      .from("chat_messages")
      .select("*")
      .eq("channel_id", channelId)
      .eq("studio_id", account.studio_id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt("created_at", before);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** POST /api/chat — Send a message */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: account } = await supabase
      .from("accounts")
      .select("id, studio_id, first_name, last_name, role")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!account) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Check subscription status for write operations
    const { data: studio } = await supabase
      .from("studios")
      .select("subscription_status")
      .eq("id", account.studio_id)
      .single();
    if (studio?.subscription_status === "suspended" || studio?.subscription_status === "cancelled") {
      return NextResponse.json({ error: "Your subscription is not active. Please renew to continue." }, { status: 403 });
    }

    if (!body.channel_id || !body.message_text?.trim()) {
      return NextResponse.json({ error: "channel_id and message_text required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        channel_id: body.channel_id,
        studio_id: account.studio_id,
        user_id: account.id,
        user_name: `${account.first_name || ""} ${account.last_name || ""}`.trim() || "Unknown",
        user_role: account.role,
        message_text: body.message_text.trim(),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
