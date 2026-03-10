import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/** GET /api/admin/session — Check if super admin session is valid */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sa_session")?.value;

    if (!sessionToken) {
      return NextResponse.json({ authenticated: false });
    }

    const adminClient = createAdminClient();

    const { data: sessions } = await (adminClient
      .from("sessions") as any)
      .select("account_id, expires_at")
      .eq("token", sessionToken)
      .limit(1);

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ authenticated: false });
    }

    const session = sessions[0];
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ authenticated: false });
    }

    const { data: accounts } = await adminClient
      .from("accounts")
      .select("id, email, first_name, is_super_admin")
      .eq("id", session.account_id)
      .limit(1);

    if (!accounts || accounts.length === 0 || !accounts[0].is_super_admin) {
      return NextResponse.json({ authenticated: false });
    }

    return NextResponse.json({ authenticated: true, email: accounts[0].email });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

/** DELETE /api/admin/session — Logout super admin */
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sa_session")?.value;

    if (sessionToken) {
      const adminClient = createAdminClient();
      await (adminClient.from("sessions") as any)
        .delete()
        .eq("token", sessionToken);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("sa_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
