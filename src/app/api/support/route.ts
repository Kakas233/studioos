import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const ticketCreateSchema = z.object({
  subject: z.string().min(1, "Subject required").max(200),
  message: z.string().max(5000).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
}).strict();

const ticketUpdateSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
  is_escalated: z.boolean().optional(),
  rating: z.number().min(1).max(5).optional(),
}).strict();

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
      .select("id, studio_id, account_id, subject, status, priority, is_escalated, rating, messages, created_at, updated_at")
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

    const parsed = ticketCreateSchema.parse(body);

    const initialMessage = parsed.message?.trim() || "";
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
        subject: parsed.subject.trim(),
        status: "open",
        priority: parsed.priority || "normal",
        messages,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** PUT /api/support — Update a ticket (add message, change status) */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, message, ...rawUpdateData } = body;
    if (!id) return NextResponse.json({ error: "Ticket ID required" }, { status: 400 });

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

    const validatedUpdate: Record<string, unknown> = ticketUpdateSchema.parse(rawUpdateData);

    // If adding a message, append to existing messages
    if (message && typeof message === "string" && message.trim()) {
      const trimmedMessage = message.trim().slice(0, 5000);
      const { data: ticket } = await supabase
        .from("support_tickets")
        .select("messages")
        .eq("id", id)
        .eq("studio_id", account.studio_id)
        .single();

      const existingMessages = (ticket?.messages as Array<Record<string, unknown>>) || [];
      validatedUpdate.messages = [
        ...existingMessages,
        {
          sender: `${account.first_name || ""} ${account.last_name || ""}`.trim(),
          role: account.role,
          text: trimmedMessage,
          timestamp: new Date().toISOString(),
        },
      ];
    }

    const { data, error } = await supabase
      .from("support_tickets")
      .update(validatedUpdate as Record<string, unknown>)
      .eq("id", id)
      .eq("studio_id", account.studio_id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
