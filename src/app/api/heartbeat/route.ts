import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const page = typeof body.page === "string" ? body.page.slice(0, 100) : null;

    const adminDb = createAdminClient();
    await adminDb
      .from("accounts")
      .update({
        last_seen_at: new Date().toISOString(),
        ...(page ? { last_seen_page: page } : {}),
      })
      .eq("auth_user_id", user.id)
      .eq("is_active", true);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
