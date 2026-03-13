import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const shiftSchema = z.object({
  model_id: z.string().uuid(),
  operator_id: z.string().uuid().optional().nullable(),
  room_id: z.string().uuid().optional().nullable(),
  start_time: z.string(),
  end_time: z.string(),
  status: z.enum(["scheduled", "completed", "no_show", "cancelled", "pending_approval"]).optional(),
}).strict();

const ALLOWED_ROLES = ["owner", "admin", "operator", "model"];

async function getAccountWithAuth(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: account } = await supabase
    .from("accounts")
    .select("id, studio_id, role, works_alone")
    .eq("auth_user_id", user.id)
    .eq("is_active", true)
    .single();

  if (!account || !ALLOWED_ROLES.includes(account.role)) return null;

  return account;
}

async function getAccountWithAuthWrite(supabase: Awaited<ReturnType<typeof createClient>>) {
  const account = await getAccountWithAuth(supabase);
  if (!account) return null;
  // Models can only create/edit shifts if they work alone
  if (account.role === "model" && !account.works_alone) return null;
  return account;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const account = await getAccountWithAuth(supabase);
    if (!account) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const adminDb = createAdminClient();
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    let query = adminDb
      .from("shifts")
      .select("*")
      .eq("studio_id", account.studio_id)
      .order("start_time", { ascending: false });

    if (dateFrom) query = query.gte("start_time", dateFrom);
    if (dateTo) query = query.lte("start_time", dateTo);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data || []);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = shiftSchema.parse(body);
    const supabase = await createClient();

    const account = await getAccountWithAuthWrite(supabase);
    if (!account) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // Use admin client for DB operations (bypasses RLS since we already verified auth)
    const adminDb = createAdminClient();

    const { data: studio } = await adminDb
      .from("studios")
      .select("subscription_status")
      .eq("id", account.studio_id)
      .single();
    if (studio?.subscription_status === "suspended" || studio?.subscription_status === "cancelled") {
      return NextResponse.json({ error: "Your subscription is not active. Please renew to continue." }, { status: 403 });
    }

    // Time validation
    const start = new Date(parsed.start_time);
    const end = new Date(parsed.end_time);
    if (end <= start) {
      return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }

    // Minimum duration: 2 hours (120 minutes)
    const durationMinutes = (end.getTime() - start.getTime()) / 60000;
    if (durationMinutes < 120) {
      return NextResponse.json({ error: "Shift must be at least 2 hours" }, { status: 400 });
    }

    // Server-side overlap detection: check for existing shifts that overlap
    const { data: overlapping } = await adminDb
      .from("shifts")
      .select("id")
      .eq("studio_id", account.studio_id)
      .eq("model_id", parsed.model_id)
      .in("status", ["scheduled", "completed", "pending_approval"])
      .lt("start_time", parsed.end_time)
      .gt("end_time", parsed.start_time)
      .limit(1);

    if (overlapping && overlapping.length > 0) {
      return NextResponse.json(
        { error: "This model already has a shift during this time period" },
        { status: 409 }
      );
    }

    // Operator overlap detection: prevent double-booking an operator
    if (parsed.operator_id && parsed.operator_id !== parsed.model_id) {
      const { data: opOverlap } = await adminDb
        .from("shifts")
        .select("id")
        .eq("studio_id", account.studio_id)
        .eq("operator_id", parsed.operator_id)
        .in("status", ["scheduled", "completed", "pending_approval"])
        .lt("start_time", parsed.end_time)
        .gt("end_time", parsed.start_time)
        .limit(1);

      if (opOverlap && opOverlap.length > 0) {
        return NextResponse.json(
          { error: "This operator already has a shift during this time period" },
          { status: 409 }
        );
      }
    }

    // Room overlap detection: prevent double-booking a room
    if (parsed.room_id) {
      const { data: roomOverlap } = await adminDb
        .from("shifts")
        .select("id")
        .eq("studio_id", account.studio_id)
        .eq("room_id", parsed.room_id)
        .in("status", ["scheduled", "completed", "pending_approval"])
        .lt("start_time", parsed.end_time)
        .gt("end_time", parsed.start_time)
        .limit(1);

      if (roomOverlap && roomOverlap.length > 0) {
        return NextResponse.json(
          { error: "This room is already booked during this time period" },
          { status: 409 }
        );
      }
    }

    const { data, error } = await adminDb
      .from("shifts")
      .insert({
        studio_id: account.studio_id,
        model_id: parsed.model_id,
        operator_id: parsed.operator_id || null,
        room_id: parsed.room_id || null,
        start_time: parsed.start_time,
        end_time: parsed.end_time,
        status: parsed.status || "scheduled",
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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) return NextResponse.json({ error: "Shift ID required" }, { status: 400 });

    const supabase = await createClient();

    const account = await getAccountWithAuthWrite(supabase);
    if (!account) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const adminDb = createAdminClient();

    const { data: studioPut } = await adminDb
      .from("studios")
      .select("subscription_status")
      .eq("id", account.studio_id)
      .single();
    if (studioPut?.subscription_status === "suspended" || studioPut?.subscription_status === "cancelled") {
      return NextResponse.json({ error: "Your subscription is not active. Please renew to continue." }, { status: 403 });
    }

    const validatedUpdate = shiftSchema.partial().parse(updateData);

    // If updating time, check for overlaps (exclude current shift)
    if (validatedUpdate.start_time && validatedUpdate.end_time) {
      const { data: existingShift } = await adminDb
        .from("shifts")
        .select("model_id")
        .eq("id", id)
        .eq("studio_id", account.studio_id)
        .single();

      if (existingShift) {
        const { data: overlapping } = await adminDb
          .from("shifts")
          .select("id")
          .eq("studio_id", account.studio_id)
          .eq("model_id", existingShift.model_id)
          .neq("id", id)
          .in("status", ["scheduled", "completed", "pending_approval"])
          .lt("start_time", validatedUpdate.end_time)
          .gt("end_time", validatedUpdate.start_time)
          .limit(1);

        if (overlapping && overlapping.length > 0) {
          return NextResponse.json(
            { error: "This model already has a shift during this time period" },
            { status: 409 }
          );
        }
      }
    }

    // Operator overlap check on update
    if (validatedUpdate.operator_id && validatedUpdate.start_time && validatedUpdate.end_time) {
      const { data: opOverlap } = await adminDb
        .from("shifts")
        .select("id")
        .eq("studio_id", account.studio_id)
        .eq("operator_id", validatedUpdate.operator_id)
        .neq("id", id)
        .in("status", ["scheduled", "completed", "pending_approval"])
        .lt("start_time", validatedUpdate.end_time)
        .gt("end_time", validatedUpdate.start_time)
        .limit(1);

      if (opOverlap && opOverlap.length > 0) {
        return NextResponse.json(
          { error: "This operator already has a shift during this time period" },
          { status: 409 }
        );
      }
    }

    // Room overlap check on update
    const roomToCheck = validatedUpdate.room_id;
    if (roomToCheck && validatedUpdate.start_time && validatedUpdate.end_time) {
      const { data: roomOverlap } = await adminDb
        .from("shifts")
        .select("id")
        .eq("studio_id", account.studio_id)
        .eq("room_id", roomToCheck)
        .neq("id", id)
        .in("status", ["scheduled", "completed", "pending_approval"])
        .lt("start_time", validatedUpdate.end_time)
        .gt("end_time", validatedUpdate.start_time)
        .limit(1);

      if (roomOverlap && roomOverlap.length > 0) {
        return NextResponse.json(
          { error: "This room is already booked during this time period" },
          { status: 409 }
        );
      }
    }

    const { data, error } = await adminDb
      .from("shifts")
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
    if (!id) return NextResponse.json({ error: "Shift ID required" }, { status: 400 });

    const supabase = await createClient();

    const account = await getAccountWithAuthWrite(supabase);
    if (!account) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const adminDb = createAdminClient();
    const { error } = await adminDb.from("shifts").delete().eq("id", id).eq("studio_id", account.studio_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
