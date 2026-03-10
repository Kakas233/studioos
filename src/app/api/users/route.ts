import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { accountUpdateSchema } from "@/lib/schemas";
import { ZodError } from "zod";

/** GET /api/users — list studio accounts */
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

    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const { data: accounts } = await supabase
      .from("accounts")
      .select("*")
      .eq("studio_id", account.studio_id)
      .order("first_name");

    return NextResponse.json(accounts || []);
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** PUT /api/users — update account */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) return NextResponse.json({ error: "Account ID required" }, { status: 400 });

    // Validate input against allowed fields
    const validated = accountUpdateSchema.parse(updateData);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Prevent role escalation: admin can't set someone to owner
    const { data: currentUser } = await supabase
      .from("accounts")
      .select("role, studio_id")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!currentUser || !["owner", "admin"].includes(currentUser.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (validated.role === "owner" && currentUser.role !== "owner") {
      return NextResponse.json({ error: "Only owners can assign the owner role" }, { status: 403 });
    }

    const { data: studio } = await supabase
      .from("studios")
      .select("subscription_status")
      .eq("id", currentUser.studio_id)
      .single();
    if (studio?.subscription_status === "suspended" || studio?.subscription_status === "cancelled") {
      return NextResponse.json({ error: "Your subscription is not active. Please renew to continue." }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("accounts")
      .update(validated)
      .eq("id", id)
      .eq("studio_id", currentUser.studio_id)
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
