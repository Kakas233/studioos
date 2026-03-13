import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";
import { z } from "zod";
import Decimal from "decimal.js";

const adminSettingsSchema = z.object({
  secondary_currency: z.string().max(10).optional(),
  exchange_rate: z.number().min(0).max(100000).optional(),
  exchange_rate_mode: z.enum(["manual", "auto"]).optional(),
  payout_frequency: z.enum(["weekly", "biweekly", "monthly"]).optional(),
  mfc_token_rate: z.number().min(0).max(1).optional(),
  cb_token_rate: z.number().min(0).max(1).optional(),
  sc_token_rate: z.number().min(0).max(1).optional(),
  bc_token_rate: z.number().min(0).max(1).optional(),
  c4_token_rate: z.number().min(0).max(1).optional(),
  cs_token_rate: z.number().min(0).max(1).optional(),
  f4f_token_rate: z.number().min(0).max(1).optional(),
  lj_token_rate: z.number().min(0).max(1).optional(),
}).strict();

async function validateSuperAdminSession(sessionToken: string) {
  const adminClient = createAdminClient();

  const { data: sessions } = await (adminClient
    .from("sessions") as any)
    .select("id, account_id, token, expires_at")
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
    .select("id, email, first_name, role, studio_id, is_super_admin")
    .eq("id", session.account_id)
    .limit(1);

  if (!accounts || accounts.length === 0 || !accounts[0].is_super_admin) {
    return { error: "Access denied", status: 403 };
  }

  return { session, account: accounts[0], adminClient };
}

export async function POST(request: Request) {
  try {
    const { action, payload } = await request.json();

    // Read session from httpOnly cookie
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("sa_session")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const auth = await validateSuperAdminSession(sessionToken);
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
        adminClient.from("studios").select("id, name, subdomain, subscription_tier, subscription_status, stripe_customer_id, stripe_subscription_id, model_limit, current_model_count, created_at, last_payment_date, next_payment_date, grace_period_ends_at"),
        adminClient.from("accounts").select("id, studio_id, role").eq("is_active", true),
        adminClient
          .from("earnings")
          .select("id, studio_id, total_gross_usd, created_at")
          .order("created_at", { ascending: false })
          .limit(500),
        adminClient
          .from("shifts")
          .select("id, created_at")
          .order("created_at", { ascending: false })
          .limit(500),
        adminClient
          .from("member_alerts")
          .select("id, studio_id, alert_type")
          .eq("is_active", true),
      ]);

      const studiosList: any[] = studios || [];
      const accountsList: any[] = allAccounts || [];
      const earningsList: any[] = allEarnings || [];
      const shiftsList: any[] = allShifts || [];
      const alertsList: any[] = allActiveAlerts || [];

      const totalRevenue = earningsList.reduce(
        (sum: Decimal, e: { total_gross_usd?: number | string | null }) => sum.plus(new Decimal(Number(e.total_gross_usd) || 0)),
        new Decimal(0)
      ).toDecimalPlaces(2).toNumber();
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
              (a: any) => !a.alert_type || a.alert_type === "room_member"
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

      // audit_logs columns: id, studio_id, entity_type, entity_id, event_type, summary, actor_email, old_data, new_data, created_at
      let query = adminClient
        .from("audit_logs")
        .select("id, studio_id, event_type, entity_type, entity_id, actor_email, summary, created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      if (studio_id) {
        query = query.eq("studio_id", studio_id);
      }
      if (date_from) {
        query = query.gte("created_at", date_from + "T00:00:00Z");
      }
      if (date_to) {
        query = query.lte("created_at", date_to + "T23:59:59Z");
      }

      const { data: auditLogs } = await query;
      const logsList = auditLogs || [];

      // Resolve studio names by fetching studios
      const studioIds = [...new Set(logsList.map((l: any) => l.studio_id).filter(Boolean))];
      let studioNameMap: Record<string, string> = {};
      if (studioIds.length > 0) {
        const { data: studioRows } = await adminClient
          .from("studios")
          .select("id, name")
          .in("id", studioIds);
        for (const s of studioRows || []) {
          studioNameMap[s.id] = s.name;
        }
      }

      // Enrich logs with studio_name for display
      const enrichedLogs = logsList.map((l: any) => ({
        ...l,
        studio_name: studioNameMap[l.studio_id] || null,
        created_date: l.created_at,
      }));

      return NextResponse.json({
        success: true,
        data: {
          logs: enrichedLogs,
          studios: Object.entries(studioNameMap).map(([id, name]) => ({
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
        .select("id, name, subdomain, timezone, subscription_tier, subscription_status, stripe_customer_id, stripe_subscription_id, model_limit, current_model_count, onboarding_completed, created_at, updated_at, last_payment_date, next_payment_date, grace_period_ends_at")
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
        { data: studioSettings },
      ] = await Promise.all([
        adminClient
          .from("accounts")
          .select("id, studio_id, first_name, last_name, email, role, is_active, cut_percentage, created_at, updated_at")
          .eq("studio_id", studioId),
        adminClient
          .from("earnings")
          .select("id, studio_id, model_id, shift_date, total_gross_usd, model_pay_usd, operator_pay_usd, created_at")
          .eq("studio_id", studioId)
          .order("shift_date", { ascending: false })
          .limit(50),
        adminClient
          .from("shifts")
          .select("id, studio_id, model_id, room_id, start_time, end_time, status, created_at")
          .eq("studio_id", studioId)
          .order("start_time", { ascending: false })
          .limit(100),
        adminClient
          .from("rooms")
          .select("id, studio_id, name, is_active, created_at")
          .eq("studio_id", studioId),
        adminClient
          .from("global_settings")
          .select("payout_frequency")
          .eq("studio_id", studioId)
          .limit(1),
      ]);

      // Build model name lookup from accounts
      const accountMap: Record<string, string> = {};
      for (const a of studioAccounts || []) {
        accountMap[a.id] = `${a.first_name} ${a.last_name || ""}`.trim();
      }

      // Enrich earnings with model_name
      const enrichedEarnings = (studioEarnings || []).map((e: any) => ({
        ...e,
        model_name: accountMap[e.model_id] || "Unknown",
      }));

      // Merge payout_frequency into studio response
      const studioResponse = {
        ...studioData[0],
        created_date: studioData[0].created_at,
        payout_frequency: studioSettings?.[0]?.payout_frequency || "biweekly",
      };

      return NextResponse.json({
        success: true,
        data: {
          studio: studioResponse,
          accounts: studioAccounts || [],
          earnings: enrichedEarnings,
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

      const validatedSettings = adminSettingsSchema.parse(settingsData);

      const { data: allSettings } = await adminClient
        .from("global_settings")
        .select("id");

      const settingIds = (allSettings || []).map((s: { id: string }) => s.id);
      if (settingIds.length > 0) {
        await adminClient.from("global_settings").update(validatedSettings).in("id", settingIds);
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
        .select("id, name, subdomain, subscription_tier, subscription_status, model_limit, current_model_count, created_at")
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
        .select("id, studio_id, first_name, last_name, email, role, is_active")
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

      // Sessions table: id, account_id, token, expires_at, created_at
      await (adminClient.from("sessions") as any).insert({
        account_id: ownerAccount.id,
        token: impersonationToken,
        expires_at: expiresAt,
      });

      // Log the impersonation
      // audit_logs: id, studio_id, entity_type, entity_id, event_type, summary, actor_email, old_data, new_data, created_at
      try {
        await adminClient.from("audit_logs").insert({
          studio_id: studioId,
          event_type: "create",
          entity_type: "Session",
          entity_id: ownerAccount.id,
          actor_email: superAdminAccount.email,
          summary: `Admin Support entered studio "${studio.name}" as ${ownerAccount.first_name}`,
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
        .select("id, account_id, telegram_chat_id, telegram_username, is_active")
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
        .select("id, account_id, telegram_chat_id, telegram_username, is_active")
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
          studio_id: superAdminAccount.studio_id,
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
        .select("id, account_id, telegram_chat_id, is_active")
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
        adminClient.from("studios").select("id, name, subdomain, subscription_tier, subscription_status, stripe_customer_id, stripe_subscription_id, model_limit, current_model_count, created_at, last_payment_date, next_payment_date, grace_period_ends_at"),
        adminClient.from("accounts").select("id, studio_id, role, is_active"),
        adminClient
          .from("member_alerts")
          .select("id, studio_id, alert_type")
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
        const day = s.created_at?.split("T")[0];
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
          created: s.created_at,
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

    if (action === "generateFreeStudio") {
      const { studio_name, owner_email, owner_password, owner_first_name, model_limit } = payload || {};
      if (!studio_name || !owner_email || !owner_password || !owner_first_name) {
        return NextResponse.json({ success: false, error: "studio_name, owner_email, owner_password, and owner_first_name are required" });
      }

      const finalModelLimit = model_limit || 30;

      // Create auth user
      const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
        email: owner_email,
        password: owner_password,
        email_confirm: true,
      });

      if (authError || !authUser?.user) {
        return NextResponse.json({ success: false, error: authError?.message || "Failed to create auth user" });
      }

      // Create studio with elite tier, active, no stripe (free)
      const { data: studioData, error: studioError } = await adminClient
        .from("studios")
        .insert({
          name: studio_name,
          subdomain: studio_name.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-"),
          subscription_tier: "elite",
          subscription_status: "active",
          model_limit: finalModelLimit,
          current_model_count: 0,
          onboarding_completed: false,
        })
        .select("id")
        .single();

      if (studioError || !studioData) {
        // Cleanup auth user on failure
        await adminClient.auth.admin.deleteUser(authUser.user.id);
        return NextResponse.json({ success: false, error: studioError?.message || "Failed to create studio" });
      }

      // Create owner account
      const { error: accountError } = await adminClient
        .from("accounts")
        .insert({
          auth_user_id: authUser.user.id,
          studio_id: studioData.id,
          email: owner_email,
          first_name: owner_first_name,
          role: "owner",
          is_active: true,
          cut_percentage: 33,
        });

      if (accountError) {
        return NextResponse.json({ success: false, error: accountError.message || "Failed to create account" });
      }

      // Create default global settings
      await adminClient.from("global_settings").insert({
        studio_id: studioData.id,
        secondary_currency: "USD",
        exchange_rate: 1,
        exchange_rate_mode: "manual",
        myfreecams_rate: 0.05,
        chaturbate_rate: 0.05,
        stripchat_rate: 0.05,
        bongacams_rate: 0.02,
        cam4_rate: 0.1,
        camsoda_rate: 0.05,
        flirt4free_rate: 0.03,
        livejasmin_rate: 1.0,
      });

      // Create default chat channel
      await adminClient.from("chat_channels").insert({
        studio_id: studioData.id,
        name: "General",
        channel_type: "general",
      });

      // Log it
      // audit_logs: id, studio_id, entity_type, entity_id, event_type, summary, actor_email, old_data, new_data, created_at
      try {
        await adminClient.from("audit_logs").insert({
          studio_id: studioData.id,
          event_type: "create",
          entity_type: "Studio",
          entity_id: studioData.id,
          actor_email: superAdminAccount.email,
          summary: `Super Admin created free Elite studio "${studio_name}" with ${finalModelLimit} model slots`,
        });
      } catch (e) {
        console.error("Failed to log studio creation:", e instanceof Error ? e.message : e);
      }

      return NextResponse.json({
        success: true,
        data: {
          studio_id: studioData.id,
          owner_email,
          studio_name,
          tier: "elite",
          model_limit: finalModelLimit,
        },
        message: `Free Elite studio "${studio_name}" created with ${finalModelLimit} model slots`,
      });
    }

    if (action === "getLiveUsers") {
      // Get all accounts with recent heartbeats (last 5 minutes = online)
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

      const [
        { data: onlineAccounts },
        { data: recentAccounts },
        { data: allStudios },
      ] = await Promise.all([
        adminClient
          .from("accounts")
          .select("id, studio_id, first_name, last_name, email, role, last_seen_at, last_seen_page")
          .eq("is_active", true)
          .gte("last_seen_at", fiveMinAgo)
          .order("last_seen_at", { ascending: false }),
        adminClient
          .from("accounts")
          .select("id, studio_id, first_name, last_name, email, role, last_seen_at, last_seen_page")
          .eq("is_active", true)
          .gte("last_seen_at", thirtyMinAgo)
          .lt("last_seen_at", fiveMinAgo)
          .order("last_seen_at", { ascending: false }),
        adminClient
          .from("studios")
          .select("id, name, subdomain, subscription_tier, subscription_status"),
      ]);

      const studioMap: Record<string, { name: string; subdomain: string; tier: string; status: string }> = {};
      (allStudios || []).forEach((s: any) => {
        studioMap[s.id] = { name: s.name, subdomain: s.subdomain, tier: s.subscription_tier, status: s.subscription_status };
      });

      // Group online users by studio
      const studioGroups: Record<string, { studio: typeof studioMap[string]; online: any[]; recent: any[] }> = {};

      const mapUser = (a: any) => ({
        id: a.id,
        first_name: a.first_name,
        last_name: a.last_name,
        email: a.email,
        role: a.role,
        last_seen_at: a.last_seen_at,
        last_seen_page: a.last_seen_page,
      });

      for (const a of (onlineAccounts || [])) {
        const sid = a.studio_id;
        if (!studioGroups[sid]) {
          studioGroups[sid] = { studio: studioMap[sid] || { name: "Unknown", subdomain: "", tier: "", status: "" }, online: [], recent: [] };
        }
        studioGroups[sid].online.push(mapUser(a));
      }

      for (const a of (recentAccounts || [])) {
        const sid = a.studio_id;
        if (!studioGroups[sid]) {
          studioGroups[sid] = { studio: studioMap[sid] || { name: "Unknown", subdomain: "", tier: "", status: "" }, online: [], recent: [] };
        }
        studioGroups[sid].recent.push(mapUser(a));
      }

      // Sort studios: most online users first
      const sortedStudios = Object.entries(studioGroups)
        .map(([studio_id, data]) => ({ studio_id, ...data }))
        .sort((a, b) => b.online.length - a.online.length);

      return NextResponse.json({
        success: true,
        data: {
          total_online: (onlineAccounts || []).length,
          total_recent: (recentAccounts || []).length,
          studios: sortedStudios,
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

      // Cancel Stripe subscription before deleting studio data
      const { data: studioToDelete } = await adminClient
        .from("studios")
        .select("stripe_subscription_id")
        .eq("id", studioId)
        .single();

      if (studioToDelete?.stripe_subscription_id) {
        try {
          const Stripe = (await import("stripe")).default;
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-02-25.clover" });
          await stripe.subscriptions.cancel(studioToDelete.stripe_subscription_id);
        } catch (stripeErr) {
          console.error("Failed to cancel Stripe subscription:", stripeErr);
        }
      }

      // Get all accounts (need auth_user_ids to delete auth users)
      const { data: studioAccounts } = await adminClient
        .from("accounts")
        .select("id, auth_user_id")
        .eq("studio_id", studioId);

      const accountIds = (studioAccounts || []).map((a: { id: string }) => a.id);
      const authUserIds = (studioAccounts || [])
        .map((a: { auth_user_id: string | null }) => a.auth_user_id)
        .filter(Boolean) as string[];

      // Permanently delete ALL related data
      if (accountIds.length > 0) {
        await adminClient.from("support_tickets").delete().eq("studio_id", studioId);
        await adminClient.from("telegram_links").delete().in("account_id", accountIds);
        await adminClient.from("member_alerts").delete().eq("studio_id", studioId);

        const { data: channels } = await adminClient
          .from("chat_channels")
          .select("id")
          .eq("studio_id", studioId);
        const channelIds = (channels || []).map((c: { id: string }) => c.id);
        if (channelIds.length > 0) {
          await adminClient.from("chat_messages").delete().in("channel_id", channelIds);
        }
        await adminClient.from("chat_channels").delete().eq("studio_id", studioId);
        await adminClient.from("shift_analyses").delete().eq("studio_id", studioId);
        await adminClient.from("shift_change_requests").delete().eq("studio_id", studioId);
        await adminClient.from("shift_requests").delete().eq("studio_id", studioId);
        await adminClient.from("shifts").delete().eq("studio_id", studioId);
        await adminClient.from("stream_segments").delete().eq("studio_id", studioId);
        await adminClient.from("daily_stream_stats").delete().eq("studio_id", studioId);
        await adminClient.from("streaming_sessions").delete().eq("studio_id", studioId);
        await adminClient.from("payouts").delete().eq("studio_id", studioId);
        await adminClient.from("earnings").delete().eq("studio_id", studioId);
        await adminClient.from("data_fetch_jobs").delete().eq("studio_id", studioId);
        await adminClient.from("assignments").delete().eq("studio_id", studioId);
        await adminClient.from("cam_accounts").delete().eq("studio_id", studioId);
        await adminClient.from("rooms").delete().eq("studio_id", studioId);
        await adminClient.from("audit_logs").delete().eq("studio_id", studioId);
        await adminClient.from("error_logs").delete().eq("studio_id", studioId);
        await adminClient.from("global_settings").delete().eq("studio_id", studioId);
        await adminClient.from("news_posts").delete().eq("studio_id", studioId);
        await adminClient.from("accounts").delete().eq("studio_id", studioId);
      }

      // Delete the studio
      await adminClient.from("studios").delete().eq("id", studioId);

      // Delete Supabase auth users so they can re-register
      for (const authUserId of authUserIds) {
        try {
          await adminClient.auth.admin.deleteUser(authUserId);
        } catch (err) {
          console.error(`Failed to delete auth user ${authUserId}:`, err);
        }
      }

      return NextResponse.json({
        success: true,
        message: "Studio and all data permanently deleted",
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
