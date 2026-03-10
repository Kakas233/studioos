import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** GET /api/alerts — Get member alerts */
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

    const { data, error } = await supabase
      .from("member_alerts")
      .select("*")
      .eq("studio_id", account.studio_id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** POST /api/alerts — Create a member alert */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: account } = await supabase
      .from("accounts")
      .select("id, studio_id, role")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!account || !["owner", "admin", "operator"].includes(account.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check subscription status for write operations
    const { data: studioPost } = await supabase
      .from("studios")
      .select("subscription_status")
      .eq("id", account.studio_id)
      .single();
    if (studioPost?.subscription_status === "suspended" || studioPost?.subscription_status === "cancelled") {
      return NextResponse.json({ error: "Your subscription is not active. Please renew to continue." }, { status: 403 });
    }

    if (!body.model_username?.trim()) {
      return NextResponse.json({ error: "Model username required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("member_alerts")
      .insert({
        studio_id: account.studio_id,
        account_id: account.id,
        cam_account_id: body.cam_account_id || null,
        model_username: body.model_username.trim(),
        model_name: body.model_name || body.model_username.trim(),
        sites: body.sites || [],
        spending_threshold: body.spending_threshold || 0,
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

/** PUT /api/alerts — Update a member alert */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    if (!id) return NextResponse.json({ error: "Alert ID required" }, { status: 400 });

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: account } = await supabase
      .from("accounts")
      .select("studio_id, role")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!account || !["owner", "admin", "operator"].includes(account.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("member_alerts")
      .update(updateData)
      .eq("id", id)
      .eq("studio_id", account.studio_id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** DELETE /api/alerts — Delete a member alert */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Alert ID required" }, { status: 400 });

    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: account } = await supabase
      .from("accounts")
      .select("studio_id, role")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!account || !["owner", "admin", "operator"].includes(account.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase
      .from("member_alerts")
      .delete()
      .eq("id", id)
      .eq("studio_id", account.studio_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
