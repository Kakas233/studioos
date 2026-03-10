import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized calls
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    let remindersSent = 0;
    let expired = 0;

    // Get all trialing studios
    const { data: trialStudios } = await admin
      .from("studios")
      .select("id, name, subdomain, trial_ends_at, grace_period_ends_at")
      .eq("subscription_status", "trialing");

    for (const studio of trialStudios || []) {
      const trialEnd = studio.trial_ends_at || studio.grace_period_ends_at;
      if (!trialEnd) continue;

      const daysLeft = daysUntil(trialEnd);
      if (daysLeft === null) continue;

      // Get owner account for email
      const { data: owners } = await admin
        .from("accounts")
        .select("email")
        .eq("studio_id", studio.id)
        .eq("role", "owner")
        .eq("is_active", true)
        .limit(1);

      const ownerEmail = owners?.[0]?.email;
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

    // Also check grace period studios
    let graceExpired = 0;
    const { data: graceStudios } = await admin
      .from("studios")
      .select("id, name, subdomain, grace_period_ends_at")
      .eq("subscription_status", "grace_period");

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

        const { data: owners } = await admin
          .from("accounts")
          .select("email")
          .eq("studio_id", studio.id)
          .eq("role", "owner")
          .eq("is_active", true)
          .limit(1);

        if (owners?.[0]?.email) {
          await sendSuspendedEmail(owners[0].email, studio.name || "Your Studio");
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
