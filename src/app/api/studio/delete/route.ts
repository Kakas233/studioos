import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/studio/delete
 *
 * Permanently deletes a studio and ALL associated data.
 * Only the studio owner can do this. Requires confirmation phrase.
 * Also deletes all Supabase auth users so they can re-register.
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: account } = await supabase
      .from("accounts")
      .select("id, studio_id, role")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .single();

    if (!account || account.role !== "owner") {
      return NextResponse.json(
        { error: "Only the studio owner can delete the studio" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { confirmation } = body;

    if (confirmation !== "DELETE MY STUDIO") {
      return NextResponse.json(
        { error: "Invalid confirmation phrase" },
        { status: 400 }
      );
    }

    const studioId = account.studio_id;
    const admin = createAdminClient();

    // 1. Get all accounts in this studio (need auth_user_ids for auth deletion)
    const { data: studioAccounts } = await admin
      .from("accounts")
      .select("id, auth_user_id")
      .eq("studio_id", studioId);

    const accountIds = (studioAccounts || []).map((a: { id: string }) => a.id);
    const authUserIds = (studioAccounts || [])
      .map((a: { auth_user_id: string | null }) => a.auth_user_id)
      .filter(Boolean) as string[];

    // 2. Delete all related data (order matters for foreign keys)
    // Delete in dependency order: children first, then parents

    if (accountIds.length > 0) {
      // Delete support tickets
      await admin.from("support_tickets").delete().eq("studio_id", studioId);

      // Delete telegram links
      await admin.from("telegram_links").delete().in("account_id", accountIds);

      // Delete member alerts
      await admin.from("member_alerts").delete().eq("studio_id", studioId);

      // Delete chat messages & channels
      const { data: channels } = await admin
        .from("chat_channels")
        .select("id")
        .eq("studio_id", studioId);
      const channelIds = (channels || []).map((c: { id: string }) => c.id);
      if (channelIds.length > 0) {
        await admin.from("chat_messages").delete().in("channel_id", channelIds);
      }
      await admin.from("chat_channels").delete().eq("studio_id", studioId);

      // Delete shift-related data
      await admin.from("shift_analyses").delete().eq("studio_id", studioId);
      await admin.from("shift_change_requests").delete().eq("studio_id", studioId);
      await admin.from("shift_requests").delete().eq("studio_id", studioId);
      await admin.from("shifts").delete().eq("studio_id", studioId);

      // Delete stream data
      await admin.from("stream_segments").delete().eq("studio_id", studioId);
      await admin.from("daily_stream_stats").delete().eq("studio_id", studioId);
      await admin.from("streaming_sessions").delete().eq("studio_id", studioId);

      // Delete financial data
      await admin.from("payouts").delete().eq("studio_id", studioId);
      await admin.from("earnings").delete().eq("studio_id", studioId);

      // Delete data fetch jobs
      await admin.from("data_fetch_jobs").delete().eq("studio_id", studioId);

      // Delete assignments
      await admin.from("assignments").delete().eq("studio_id", studioId);

      // Delete cam accounts
      await admin.from("cam_accounts").delete().eq("studio_id", studioId);

      // Delete rooms
      await admin.from("rooms").delete().eq("studio_id", studioId);

      // Delete audit logs
      await admin.from("audit_logs").delete().eq("studio_id", studioId);

      // Delete error logs
      await admin.from("error_logs").delete().eq("studio_id", studioId);

      // Delete global settings
      await admin.from("global_settings").delete().eq("studio_id", studioId);

      // Delete accounts
      await admin.from("accounts").delete().eq("studio_id", studioId);
    }

    // 3. Delete the studio itself
    await admin.from("studios").delete().eq("id", studioId);

    // 4. Delete Supabase auth users so they can re-register
    for (const authUserId of authUserIds) {
      try {
        await admin.auth.admin.deleteUser(authUserId);
      } catch (err) {
        console.error(`Failed to delete auth user ${authUserId}:`, err);
        // Continue with others even if one fails
      }
    }

    // 5. Sign out the current user (their auth user was just deleted)
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: "Studio and all data permanently deleted",
    });
  } catch (error) {
    console.error("Studio deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete studio" },
      { status: 500 }
    );
  }
}
