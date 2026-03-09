import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PLATFORMS } from "@/lib/platforms";

const validPlatforms = Object.keys(PLATFORMS);

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

    if (!body.platform || !validPlatforms.includes(body.platform)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }
    if (!body.model_id) {
      return NextResponse.json({ error: "Model ID required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("cam_accounts")
      .insert({
        studio_id: account.studio_id,
        model_id: body.model_id,
        platform: body.platform,
        username: body.username || "",
        is_active: true,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    if (!id) return NextResponse.json({ error: "Cam account ID required" }, { status: 400 });

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cam_accounts")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Cam account ID required" }, { status: 400 });

    const supabase = await createClient();
    const { error } = await supabase.from("cam_accounts").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
