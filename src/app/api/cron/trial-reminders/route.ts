import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { timingSafeEqual } from "crypto";
import {
  sendTrial3DayEmail,
  sendTrial1DayEmail,
  sendTrialExpiredEmail,
  sendSuspendedEmail,
} from "@/lib/email";

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const authHeader = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${cronSecret}`;
  if (authHeader.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
}

/**
 * GET /api/cron/trial-reminders — Called by Vercel Cron.
 */
export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runTrialReminders();
}

/**
 * POST /api/cron/trial-reminders — Called manually.
 */
export async function POST(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runTrialReminders();
}

async function runTrialReminders() {
  try {
    const admin = createAdminClient();
    let remindersSent = 0;
    let expired = 0;

    // Get all trialing studios
    const { data: trialStudios } = await admin
      .from("studios")
      .select("id, name, subdomain, trial_ends_at, grace_period_ends_at")
      .eq("subscription_status", "trialing");

    // Batch fetch all owners for trial studios in one query
    const trialStudioIds = (trialStudios || []).map((s) => s.id);
    const { data: trialOwners } = trialStudioIds.length > 0
      ? await admin
          .from("accounts")
          .select("studio_id, email")
          .in("studio_id", trialStudioIds)
          .eq("role", "owner")
          .eq("is_active", true)
      : { data: [] };

    const ownerEmailMap = new Map<string, string>();
    for (const owner of trialOwners || []) {
      if (!ownerEmailMap.has(owner.studio_id)) {
        ownerEmailMap.set(owner.studio_id, owner.email);
      }
    }

    for (const studio of trialStudios || []) {
      const trialEnd = studio.trial_ends_at || studio.grace_period_ends_at;
      if (!trialEnd) continue;

      const daysLeft = daysUntil(trialEnd);
      if (daysLeft === null) continue;

      const ownerEmail = ownerEmailMap.get(studio.id);
      if (!ownerEmail) continue;

      const studioName = studio.name || "Your Studio";
      const subdomain = studio.subdomain || "";

      // 3 days left
      if (daysLeft === 3) {
        await sendTrial3DayEmail(ownerEmail, studioName, subdomain);
        remindersSent++;
      }

      // 1 day left
      if (daysLeft === 1) {
        await sendTrial1DayEmail(ownerEmail, studioName, subdomain);
        remindersSent++;
      }

      // Expired — suspend
      if (daysLeft <= 0) {
        await admin
          .from("studios")
          .update({
            subscription_status: "suspended",
            model_limit: 0,
          })
          .eq("id", studio.id);

        await sendTrialExpiredEmail(ownerEmail, studioName, subdomain);
        expired++;
      }
    }

    // Also check grace period / past_due studios with expired grace periods
    let graceExpired = 0;
    const { data: graceStudios } = await admin
      .from("studios")
      .select("id, name, subdomain, grace_period_ends_at, subscription_status")
      .not("grace_period_ends_at", "is", null)
      .in("subscription_status", ["grace_period", "past_due"]);

    // Batch fetch all owners for grace period studios
    const graceStudioIds = (graceStudios || []).map((s) => s.id);
    const { data: graceOwners } = graceStudioIds.length > 0
      ? await admin
          .from("accounts")
          .select("studio_id, email")
          .in("studio_id", graceStudioIds)
          .eq("role", "owner")
          .eq("is_active", true)
      : { data: [] };

    const graceOwnerMap = new Map<string, string>();
    for (const owner of graceOwners || []) {
      if (!graceOwnerMap.has(owner.studio_id)) {
        graceOwnerMap.set(owner.studio_id, owner.email);
      }
    }

    const now = new Date();
    for (const studio of graceStudios || []) {
      if (
        studio.grace_period_ends_at &&
        new Date(studio.grace_period_ends_at) < now
      ) {
        await admin
          .from("studios")
          .update({
            subscription_status: "suspended",
            model_limit: 0,
          })
          .eq("id", studio.id);

        const graceEmail = graceOwnerMap.get(studio.id);
        if (graceEmail) {
          await sendSuspendedEmail(graceEmail, studio.name || "Your Studio");
        }
        graceExpired++;
      }
    }

    return NextResponse.json({
      success: true,
      reminders_sent: remindersSent,
      trials_expired: expired,
      grace_expired: graceExpired,
    });
  } catch (error) {
    console.error("Trial reminders error:", error);
    return NextResponse.json(
      { error: "Failed to process trial reminders" },
      { status: 500 }
    );
  }
}
