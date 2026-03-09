import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/support — Get support tickets */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: account } = await supabase
      .from("accounts")
      .select("id, studio_id, role")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!account) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Admin/owner see all tickets, others see only their own
    let query = supabase
      .from("support_tickets")
      .select("*")
      .eq("studio_id", account.studio_id)
      .order("updated_at", { ascending: false });

    if (!["owner", "admin"].includes(account.role)) {
      query = query.eq("account_id", account.id);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** POST /api/support — Create a support ticket */
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

    if (!body.subject?.trim()) {
      return NextResponse.json({ error: "Subject required" }, { status: 400 });
    }

    const initialMessage = body.message?.trim() || "";
    const messages = initialMessage
      ? [
          {
            sender: `${account.first_name || ""} ${account.last_name || ""}`.trim(),
            role: account.role,
            text: initialMessage,
            timestamp: new Date().toISOString(),
          },
        ]
      : [];

    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        studio_id: account.studio_id,
        account_id: account.id,
        subject: body.subject.trim(),
        status: "open",
        priority: body.priority || "normal",
        messages,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** PUT /api/support — Update a ticket (add message, change status) */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, message, ...updateData } = body;
    if (!id) return NextResponse.json({ error: "Ticket ID required" }, { status: 400 });

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: account } = await supabase
      .from("accounts")
      .select("id, first_name, last_name, role")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!account) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // If adding a message, append to existing messages
    if (message?.trim()) {
      const { data: ticket } = await supabase
        .from("support_tickets")
        .select("messages")
        .eq("id", id)
        .single();

      const existingMessages = (ticket?.messages as Array<Record<string, unknown>>) || [];
      updateData.messages = [
        ...existingMessages,
        {
          sender: `${account.first_name || ""} ${account.last_name || ""}`.trim(),
          role: account.role,
          text: message.trim(),
          timestamp: new Date().toISOString(),
        },
      ];
    }

    const { data, error } = await supabase
      .from("support_tickets")
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
