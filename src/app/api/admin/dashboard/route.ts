import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

async function validateSuperAdminSession(sessionToken: string) {
  const adminClient = createAdminClient();

  const { data: sessions } = await (adminClient
    .from("sessions") as any)
    .select("*")
    .eq("token", sessionToken)
    .limit(1);

  if (!sessions || sessions.length === 0) {
    return { error: "Invalid session", status: 401 };
  }

  const session = sessions[0];
  if (new Date(session.expires_at) < new Date()) {
    return { error: "Session expired", status: 401 };
  }

  const { data: accounts } = await adminClient
    .from("accounts")
    .select("*")
    .eq("id", session.account_id)
    .limit(1);

  if (!accounts || accounts.length === 0 || !accounts[0].is_super_admin) {
    return { error: "Access denied", status: 403 };
  }

  return { session, account: accounts[0], adminClient };
}

export async function POST(request: Request) {
  try {
    const { session_token, action, payload } = await request.json();

    if (!session_token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const auth = await validateSuperAdminSession(session_token);
    if ("error" in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const { account: superAdminAccount } = auth;
    const adminClient = createAdminClient();

    // --- ACTIONS ---

    if (action === "getDashboard") {
      const [
        { data: studios },
        { data: allAccounts },
        { data: allEarnings },
        { data: allShifts },
        { data: allActiveAlerts },
      ] = await Promise.all([
        adminClient.from("studios").select("*"),
        adminClient.from("accounts").select("*").eq("is_active", true),
        adminClient
          .from("earnings")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500),
        adminClient
          .from("shifts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(500),
        adminClient
          .from("member_alerts")
          .select("*")
          .eq("is_active", true),
      ]);

      const studiosList: any[] = studios || [];
      const accountsList: any[] = allAccounts || [];
      const earningsList: any[] = allEarnings || [];
      const shiftsList: any[] = allShifts || [];
      const alertsList: any[] = allActiveAlerts || [];

      const totalRevenue = earningsList.reduce(
        (sum, e) => sum + (Number(e.total_gross_usd) || 0),
        0
      );
      const totalModels = accountsList.filter(
        (a) => a.role === "model"
      ).length;
      const totalOperators = accountsList.filter(
        (a) => a.role === "operator"
      ).length;

      // Count alerts per studio
      const alertsByStudio: Record<string, number> = {};
      for (const alert of alertsList) {
        const sid = alert.studio_id || "unknown";
        alertsByStudio[sid] = (alertsByStudio[sid] || 0) + 1;
      }

      return NextResponse.json({
        success: true,
        data: {
          studios: studiosList.map((s) => ({
            id: s.id,
            name: s.name,
            subdomain: s.subdomain,
            subscription_tier: s.subscription_tier,
            subscription_status: s.subscription_status,
            stripe_customer_id: s.stripe_customer_id,
            stripe_subscription_id: s.stripe_subscription_id,
            model_limit: s.model_limit,
            current_model_count: s.current_model_count,
            created_date: s.created_at,
            last_payment_date: s.last_payment_date,
            next_payment_date: s.next_payment_date,
            grace_period_ends_at: s.grace_period_ends_at,
            active_alerts: alertsByStudio[s.id] || 0,
          })),
          stats: {
            total_studios: studiosList.length,
            active_studios: studiosList.filter(
              (s) => s.subscription_status === "active"
            ).length,
            trialing_studios: studiosList.filter(
              (s) => s.subscription_status === "trialing"
            ).length,
            suspended_studios: studiosList.filter(
              (s) => s.subscription_status === "suspended"
            ).length,
            grace_period_studios: studiosList.filter(
              (s) => s.subscription_status === "grace_period"
            ).length,
            total_models: totalModels,
            total_operators: totalOperators,
            total_accounts: accountsList.length,
            total_revenue_usd: totalRevenue,
            total_shifts: shiftsList.length,
            total_earnings_records: earningsList.length,
            tiers: {
              elite: studiosList.filter(
                (s) => s.subscription_tier === "elite"
              ).length,
              pro: studiosList.filter((s) => s.subscription_tier === "pro")
                .length,
              starter: studiosList.filter(
                (s) => s.subscription_tier === "starter"
              ).length,
              free: studiosList.filter(
                (s) =>
                  !s.subscription_tier || s.subscription_tier === "free"
              ).length,
            },
            total_active_alerts: alertsList.length,
            room_member_alerts: alertsList.filter(
              (a: any) => a.alert_type === "room_member"
            ).length,
            online_tracking_alerts: alertsList.filter(
              (a: any) => a.alert_type === "online_tracking"
            ).length,
          },
        },
      });
    }

    if (action === "getActivityFeed") {
      const { studio_id, date_from, date_to } = payload || {};

      let query = adminClient
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (studio_id) {
        query = query.eq("studio_id", studio_id);
      }

      const { data: auditLogs } = await query;
      let filtered = auditLogs || [];

      if (date_from) {
        filtered = filtered.filter(
          (l: any) => (l.created_at || l.created_date) >= date_from
        );
      }
      if (date_to) {
        const endDate = date_to + "T23:59:59";
        filtered = filtered.filter(
          (l: any) => (l.created_at || l.created_date) <= endDate
        );
      }

      const studioNames: Record<string, string> = {};
      (auditLogs || []).forEach((l: any) => {
        if (l.studio_id && l.studio_name)
          studioNames[l.studio_id] = l.studio_name;
      });

      return NextResponse.json({
        success: true,
        data: {
          logs: filtered,
          studios: Object.entries(studioNames).map(([id, name]) => ({
            id,
            name,
          })),
        },
      });
    }

    if (action === "getStudioDetails") {
      const studioId = payload?.studio_id;
      if (!studioId)
        return NextResponse.json({
          success: false,
          error: "studio_id required",
        });

      const { data: studioData } = await adminClient
        .from("studios")
        .select("*")
        .eq("id", studioId)
        .limit(1);

      if (!studioData || studioData.length === 0)
        return NextResponse.json({
          success: false,
          error: "Studio not found",
        });

      const [
        { data: studioAccounts },
        { data: studioEarnings },
        { data: studioShifts },
        { data: studioRooms },
      ] = await Promise.all([
        adminClient
          .from("accounts")
          .select("*")
          .eq("studio_id", studioId),
        adminClient
          .from("earnings")
          .select("*")
          .eq("studio_id", studioId),
        adminClient
          .from("shifts")
          .select("*")
          .eq("studio_id", studioId),
        adminClient
          .from("rooms")
          .select("*")
          .eq("studio_id", studioId),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          studio: studioData[0],
          accounts: studioAccounts || [],
          earnings: studioEarnings || [],
          shifts: studioShifts || [],
          rooms: studioRooms || [],
        },
      });
    }

    if (action === "updateGlobalSettings") {
      const settingsData = payload?.settings;
      if (!settingsData)
        return NextResponse.json({
          success: false,
          error: "settings required",
        });

      const { data: allSettings } = await adminClient
        .from("global_settings")
        .select("*");

      for (const setting of allSettings || []) {
        await adminClient
          .from("global_settings")
          .update(settingsData)
          .eq("id", setting.id);
      }

      return NextResponse.json({
        success: true,
        message: `Updated ${(allSettings || []).length} settings records`,
      });
    }

    if (action === "impersonateStudio") {
      const studioId = payload?.studio_id;
      const readOnly = payload?.read_only === true;
      if (!studioId)
        return NextResponse.json({
          success: false,
          error: "studio_id required",
        });

      const { data: studioData } = await adminClient
        .from("studios")
        .select("*")
        .eq("id", studioId)
        .limit(1);

      if (!studioData || studioData.length === 0)
        return NextResponse.json({
          success: false,
          error: "Studio not found",
        });

      const studio = studioData[0];

      const { data: studioAccounts } = await adminClient
        .from("accounts")
        .select("*")
        .eq("studio_id", studioId)
        .eq("is_active", true);

      const accountsList = studioAccounts || [];
      const ownerAccount =
        accountsList.find((a) => a.role === "owner") ||
        accountsList.find((a) => a.role === "admin") ||
        accountsList[0];

      if (!ownerAccount)
        return NextResponse.json({
          success: false,
          error: "No active accounts in this studio",
        });

      const tokenBytes = crypto.randomBytes(32);
      const impersonationToken = tokenBytes.toString("hex");

      const expiresAt = new Date(
        Date.now() + 2 * 60 * 60 * 1000
      ).toISOString();

      await (adminClient.from("sessions") as any).insert({
        account_id: ownerAccount.id,
        token: impersonationToken,
        expires_at: expiresAt,
        is_impersonation: true,
        impersonated_by: superAdminAccount.id,
        is_read_only: readOnly,
      });

      // Log the impersonation
      try {
        await adminClient.from("audit_logs").insert({
          studio_id: studioId,
          studio_name: studio.name || "Unknown",
          event_type: "create",
          entity_type: "Session",
          entity_id: "impersonation",
          actor_id: superAdminAccount.id,
          actor_email: superAdminAccount.email,
          actor_name: "Admin Support",
          summary: `Admin Support entered studio "${studio.name}" as ${ownerAccount.first_name}`,
          synced_to_sheets: false,
        });
      } catch (e) {
        console.error(
          "Failed to log impersonation:",
          e instanceof Error ? e.message : e
        );
      }

      return NextResponse.json({
        success: true,
        session_token: impersonationToken,
        studio,
        impersonated_as: ownerAccount.first_name,
        expires_at: expiresAt,
        is_read_only: readOnly,
      });
    }

    if (action === "getTelegramStatus") {
      const { data: telegramLinks } = await (adminClient
        .from("telegram_links") as any)
        .select("*")
        .eq("account_id", superAdminAccount.id);

      const links = telegramLinks || [];
      const link = links.find(
        (l: any) => l.telegram_chat_id && l.is_active
      );

      return NextResponse.json({
        success: true,
        data: {
          connected: !!link,
          telegram_username: link?.telegram_username || null,
          telegram_chat_id: link?.telegram_chat_id || null,
          all_links: links.map((l: any) => ({
            id: l.id,
            is_active: l.is_active,
            telegram_username: l.telegram_username,
            telegram_chat_id: l.telegram_chat_id,
          })),
        },
      });
    }

    if (action === "connectTelegram") {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken)
        return NextResponse.json({
          success: false,
          error: "TELEGRAM_BOT_TOKEN not set",
        });

      const token = crypto.randomUUID().replace(/-/g, "").slice(0, 16);

      const { data: existing } = await (adminClient
        .from("telegram_links") as any)
        .select("*")
        .eq("account_id", superAdminAccount.id);

      if (existing && existing.length > 0) {
        await (adminClient
          .from("telegram_links") as any)
          .update({
            link_token: token,
            is_active: true,
            telegram_chat_id: "",
            telegram_username: "",
          })
          .eq("id", existing[0].id);
      } else {
        await (adminClient.from("telegram_links") as any).insert({
          account_id: superAdminAccount.id,
          studio_id: "",
          link_token: token,
          is_active: true,
        });
      }

      const botInfo = await fetch(
        `https://api.telegram.org/bot${botToken}/getMe`
      ).then((r) => r.json());
      const botUsername =
        botInfo.result?.username || "StudioOS_Alerts_bot";

      return NextResponse.json({
        success: true,
        link_url: `https://t.me/${botUsername}?start=${token}`,
        token,
      });
    }

    if (action === "testTelegram") {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken)
        return NextResponse.json({
          success: false,
          error: "TELEGRAM_BOT_TOKEN not set",
        });

      const { data: telegramLinks } = await (adminClient
        .from("telegram_links") as any)
        .select("*")
        .eq("account_id", superAdminAccount.id)
        .eq("is_active", true);

      const link = (telegramLinks || []).find(
        (l: any) => l.telegram_chat_id
      );
      if (!link)
        return NextResponse.json({
          success: false,
          error: "Telegram not connected",
        });

      const res = await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: link.telegram_chat_id,
            text: '<b>Test from Super Admin Panel!</b>\n\nYour Telegram notifications are working.',
            parse_mode: "HTML",
          }),
        }
      );
      const result = await res.json();
      return NextResponse.json({
        success: result.ok,
        error: result.ok ? null : result.description,
      });
    }

    if (action === "getDailyLog") {
      const [
        { data: studios },
        { data: allAccounts },
        { data: allActiveAlerts },
      ] = await Promise.all([
        adminClient.from("studios").select("*"),
        adminClient.from("accounts").select("*"),
        adminClient
          .from("member_alerts")
          .select("*")
          .eq("is_active", true),
      ]);

      const studiosList: any[] = studios || [];
      const accountsList: any[] = allAccounts || [];
      const alertsList: any[] = allActiveAlerts || [];

      // Build per-day registration data
      const dailyRegistrations: Record<
        string,
        { name: string; tier: string; status: string }[]
      > = {};
      studiosList.forEach((s) => {
        const day = (s.created_at || s.created_date)?.split("T")[0];
        if (day) {
          if (!dailyRegistrations[day]) dailyRegistrations[day] = [];
          dailyRegistrations[day].push({
            name: s.name,
            tier: s.subscription_tier,
            status: s.subscription_status,
          });
        }
      });

      const sortedDays = Object.keys(dailyRegistrations)
        .sort()
        .reverse()
        .slice(0, 30);

      // Subscription funnel
      const totalCreated = studiosList.length;
      const totalTrialing = studiosList.filter(
        (s) => s.subscription_status === "trialing"
      ).length;
      const totalActive = studiosList.filter(
        (s) => s.subscription_status === "active"
      ).length;
      const totalSuspended = studiosList.filter(
        (s) => s.subscription_status === "suspended"
      ).length;
      const totalGrace = studiosList.filter(
        (s) => s.subscription_status === "grace_period"
      ).length;
      const totalCancelled = studiosList.filter(
        (s) => s.subscription_status === "cancelled"
      ).length;

      // Tier breakdown
      const tierBreakdown: Record<string, number> = {
        elite: 0,
        pro: 0,
        starter: 0,
        free: 0,
      };
      studiosList.forEach((s) => {
        const t = s.subscription_tier || "free";
        tierBreakdown[t] = (tierBreakdown[t] || 0) + 1;
      });

      // Paying studios
      const payingStudios = studiosList.filter(
        (s) =>
          s.subscription_status === "active" &&
          s.subscription_tier &&
          s.subscription_tier !== "free"
      );

      // Account stats
      const activeAccounts = accountsList.filter((a) => a.is_active);
      const inactiveAccounts = accountsList.filter((a) => !a.is_active);
      const roleBreakdown: Record<string, number> = {
        owner: 0,
        admin: 0,
        operator: 0,
        model: 0,
        accountant: 0,
      };
      activeAccounts.forEach((a) => {
        roleBreakdown[a.role] = (roleBreakdown[a.role] || 0) + 1;
      });

      // Alerts per studio
      const alertsByStudio: Record<
        string,
        { count: number; studio_name: string | null }
      > = {};
      alertsList.forEach((a) => {
        const sid = a.studio_id || "orphan";
        if (!alertsByStudio[sid])
          alertsByStudio[sid] = { count: 0, studio_name: null };
        alertsByStudio[sid].count++;
      });
      studiosList.forEach((s) => {
        if (alertsByStudio[s.id])
          alertsByStudio[s.id].studio_name = s.name;
      });

      // Stripe
      const stripeConnected = studiosList.filter(
        (s) => s.stripe_customer_id
      ).length;
      const stripeSubscribed = studiosList.filter(
        (s) => s.stripe_subscription_id
      ).length;

      // Grace period details
      const graceStudios = studiosList
        .filter((s) => s.subscription_status === "grace_period")
        .map((s) => ({
          name: s.name,
          tier: s.subscription_tier,
          grace_ends: s.grace_period_ends_at,
        }));

      // Trialing details
      const trialingStudios = studiosList
        .filter((s) => s.subscription_status === "trialing")
        .map((s) => ({
          name: s.name,
          tier: s.subscription_tier,
          grace_ends: s.grace_period_ends_at,
          created: s.created_at || s.created_date,
        }));

      return NextResponse.json({
        success: true,
        data: {
          summary: {
            total_studios: totalCreated,
            trialing: totalTrialing,
            active: totalActive,
            suspended: totalSuspended,
            grace_period: totalGrace,
            cancelled: totalCancelled,
            paying: payingStudios.length,
            stripe_connected: stripeConnected,
            stripe_subscribed: stripeSubscribed,
          },
          tier_breakdown: tierBreakdown,
          accounts: {
            total: accountsList.length,
            active: activeAccounts.length,
            inactive: inactiveAccounts.length,
            roles: roleBreakdown,
          },
          alerts: {
            total_active: alertsList.length,
            by_studio: Object.entries(alertsByStudio).map(
              ([sid, d]) => ({
                studio_id: sid,
                studio_name: d.studio_name || "Orphaned",
                count: d.count,
              })
            ),
          },
          daily_registrations: sortedDays.map((day) => ({
            date: day,
            studios: dailyRegistrations[day],
          })),
          grace_studios: graceStudios,
          trialing_studios: trialingStudios,
          paying_studios: payingStudios.map((s) => ({
            name: s.name,
            tier: s.subscription_tier,
            last_payment: s.last_payment_date,
            next_payment: s.next_payment_date,
          })),
        },
      });
    }

    if (action === "deleteStudio") {
      const studioId = payload?.studio_id;
      if (!studioId)
        return NextResponse.json({
          success: false,
          error: "studio_id required",
        });

      // Deactivate all accounts
      const { data: studioAccounts } = await adminClient
        .from("accounts")
        .select("id")
        .eq("studio_id", studioId);

      for (const acc of studioAccounts || []) {
        await adminClient
          .from("accounts")
          .update({ is_active: false })
          .eq("id", acc.id);
      }

      // Deactivate all MemberAlerts
      const { data: studioAlerts } = await adminClient
        .from("member_alerts")
        .select("id")
        .eq("studio_id", studioId)
        .eq("is_active", true);

      for (const alert of studioAlerts || []) {
        await adminClient
          .from("member_alerts")
          .update({ is_active: false })
          .eq("id", alert.id);
      }

      // Deactivate CamAccounts
      const { data: studioCams } = await adminClient
        .from("cam_accounts")
        .select("id")
        .eq("studio_id", studioId)
        .eq("is_active", true);

      for (const cam of studioCams || []) {
        await adminClient
          .from("cam_accounts")
          .update({ is_active: false })
          .eq("id", cam.id);
      }

      // Delete the studio
      await adminClient.from("studios").delete().eq("id", studioId);

      return NextResponse.json({
        success: true,
        message:
          "Studio deleted and all associated data deactivated",
      });
    }

    return NextResponse.json({
      success: false,
      error: "Unknown action",
    });
  } catch (error) {
    console.error("Super admin dashboard error:", error);
    return NextResponse.json(
      { success: false, error: "Operation failed" },
      { status: 500 }
    );
  }
}
