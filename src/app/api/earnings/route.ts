import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const earningsInsertSchema = z.object({
  model_id: z.string().uuid(),
  cam_account_id: z.string().uuid().optional().nullable(),
  shift_id: z.string().uuid().optional().nullable(),
  shift_date: z.string(),
  operator_id: z.string().uuid().optional().nullable(),
  total_gross_usd: z.number().min(0).optional(),
  studio_cut_usd: z.number().min(0).optional(),
  model_pay_usd: z.number().min(0).optional(),
  operator_pay_usd: z.number().min(0).optional(),
  total_gross_secondary: z.number().min(0).optional(),
  model_pay_secondary: z.number().min(0).optional(),
  operator_pay_secondary: z.number().min(0).optional(),
  myfreecams_usd: z.number().min(0).optional(),
  chaturbate_usd: z.number().min(0).optional(),
  stripchat_usd: z.number().min(0).optional(),
  bongacams_usd: z.number().min(0).optional(),
  cam4_usd: z.number().min(0).optional(),
  camsoda_usd: z.number().min(0).optional(),
  flirt4free_usd: z.number().min(0).optional(),
  livejasmin_usd: z.number().min(0).optional(),
  onlyfans_usd: z.number().min(0).optional(),
  is_estimated: z.boolean().optional(),
});

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

    const parsed = earningsInsertSchema.parse(body);

    // Auto-calculate studio_cut_usd as the leftover (gross - model - operator)
    // Studio/admin/owner share is always what's left after model and operator cuts
    if (parsed.total_gross_usd !== undefined) {
      const gross = parsed.total_gross_usd || 0;
      const modelPay = parsed.model_pay_usd || 0;
      const operatorPay = parsed.operator_pay_usd || 0;

      if (modelPay + operatorPay > gross) {
        return NextResponse.json({ error: "Model pay + operator pay cannot exceed gross earnings" }, { status: 400 });
      }

      // Studio always gets the leftover
      parsed.studio_cut_usd = Math.round((gross - modelPay - operatorPay) * 100) / 100;
    }

    // Insert first, then check for shift-level duplicates (closes race window)
    const { data, error } = await supabase
      .from("earnings")
      .insert({ studio_id: account.studio_id, ...parsed })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Post-insert duplicate check: if shift_id provided, verify no other row exists for same shift
    if (parsed.shift_id && data) {
      const { data: duplicates } = await supabase
        .from("earnings")
        .select("id")
        .eq("shift_id", parsed.shift_id)
        .eq("studio_id", account.studio_id)
        .order("created_at", { ascending: true })
        .limit(2);

      if (duplicates && duplicates.length > 1 && duplicates[0].id !== data.id) {
        // We lost the race — delete our duplicate and return the existing one
        await supabase.from("earnings").delete().eq("id", data.id);
        return NextResponse.json({ error: "Earnings already recorded for this shift" }, { status: 409 });
      }
    }

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
    if (!id) return NextResponse.json({ error: "Earning ID required" }, { status: 400 });

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

    const validatedUpdate = earningsInsertSchema.partial().parse(updateData);

    const { data, error } = await supabase
      .from("earnings")
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
