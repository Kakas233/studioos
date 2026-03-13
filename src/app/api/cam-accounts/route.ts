import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PLATFORMS } from "@/lib/platforms";
import { z } from "zod";

const camAccountUpdateSchema = z.object({
  platform: z.enum(["MyFreeCams", "Chaturbate", "StripChat", "BongaCams", "Cam4", "CamSoda", "Flirt4Free", "LiveJasmin"]).optional(),
  username: z.string().max(200).optional(),
  is_active: z.boolean().optional(),
  model_id: z.string().uuid().optional(),
}).strict();

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

    // Check subscription status for write operations
    const { data: studioPost } = await supabase
      .from("studios")
      .select("subscription_status")
      .eq("id", account.studio_id)
      .single();
    if (studioPost?.subscription_status === "suspended" || studioPost?.subscription_status === "cancelled") {
      return NextResponse.json({ error: "Your subscription is not active. Please renew to continue." }, { status: 403 });
    }

    if (!body.platform || !validPlatforms.includes(body.platform)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }
    if (!body.model_id) {
      return NextResponse.json({ error: "Model ID required" }, { status: 400 });
    }

    // Prevent duplicate platform+username for the same model
    if (body.username) {
      const { data: existingCam } = await supabase
        .from("cam_accounts")
        .select("id")
        .eq("studio_id", account.studio_id)
        .eq("model_id", body.model_id)
        .eq("platform", body.platform)
        .ilike("username", body.username)
        .limit(1);

      if (existingCam && existingCam.length > 0) {
        return NextResponse.json({ error: "This model already has an account on this platform with this username" }, { status: 409 });
      }
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

    const validatedUpdate = camAccountUpdateSchema.parse(updateData);

    const { data, error } = await supabase
      .from("cam_accounts")
      .update(validatedUpdate)
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Cam account ID required" }, { status: 400 });

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

    const { error } = await supabase
      .from("cam_accounts")
      .delete()
      .eq("id", id)
      .eq("studio_id", account.studio_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
