import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { roomSchema } from "@/lib/schemas";
import { ZodError } from "zod";

export async function GET() {
  try {
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

    const { data } = await supabase
      .from("rooms")
      .select("id, studio_id, name, is_active, created_at, updated_at")
      .eq("studio_id", account.studio_id)
      .order("name");
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: account } = await supabase
      .from("accounts")
      .select("studio_id, role")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!account || !["owner", "admin"].includes(account.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: studio } = await supabase
      .from("studios")
      .select("subscription_status")
      .eq("id", account.studio_id)
      .single();
    if (studio?.subscription_status === "suspended" || studio?.subscription_status === "cancelled") {
      return NextResponse.json({ error: "Your subscription is not active. Please renew to continue." }, { status: 403 });
    }

    // Validate input
    const validated = roomSchema.parse({ name: body.name });

    // Check for duplicate room name in this studio
    const { data: existingRoom } = await supabase
      .from("rooms")
      .select("id")
      .eq("studio_id", account.studio_id)
      .ilike("name", validated.name)
      .limit(1);

    if (existingRoom && existingRoom.length > 0) {
      return NextResponse.json({ error: "A room with this name already exists" }, { status: 409 });
    }

    const { data, error } = await supabase
      .from("rooms")
      .insert({
        studio_id: account.studio_id,
        name: validated.name,
        is_active: true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Invalid input", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    if (!id) return NextResponse.json({ error: "Room ID required" }, { status: 400 });

    // Validate input
    const validated = roomSchema.parse(updateData);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: account } = await supabase
      .from("accounts")
      .select("studio_id, role")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!account || !["owner", "admin"].includes(account.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("rooms")
      .update(validated)
      .eq("id", id)
      .eq("studio_id", account.studio_id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "Invalid input", details: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Room ID required" }, { status: 400 });

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: account } = await supabase
      .from("accounts")
      .select("studio_id, role")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!account || !["owner", "admin"].includes(account.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase.from("rooms").delete().eq("id", id).eq("studio_id", account.studio_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
