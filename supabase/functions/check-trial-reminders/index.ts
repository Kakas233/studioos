// Supabase Edge Function: check-trial-reminders
// Runs daily via pg_cron to send trial expiration reminders
// and handle grace period expirations

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const results = {
      trialExpiring: 0,
      trialExpired: 0,
      gracePeriodExpired: 0,
    };

    // 1. Find studios with trials expiring in 2 days
    const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const { data: expiringTrials } = await supabase
      .from("studios")
      .select("id, name, trial_ends_at")
      .eq("subscription_status", "trialing")
      .lte("trial_ends_at", twoDaysFromNow.toISOString())
      .gt("trial_ends_at", now.toISOString());

    if (expiringTrials && expiringTrials.length > 0) {
      for (const studio of expiringTrials) {
        // Get owner's email
        const { data: owner } = await supabase
          .from("accounts")
          .select("email, first_name")
          .eq("studio_id", studio.id)
          .eq("role", "owner")
          .eq("is_active", true)
          .single();

        if (owner?.email) {
          // Send reminder email via Resend or log it
          const resendKey = Deno.env.get("RESEND_API_KEY");
          if (resendKey) {
            try {
              await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${resendKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  from: "StudioOS <noreply@getstudioos.com>",
                  to: [owner.email],
                  subject: `Your StudioOS trial expires soon`,
                  html: `
                    <h2>Hi ${owner.first_name || "there"},</h2>
                    <p>Your StudioOS trial for <strong>${studio.name}</strong> expires in 2 days.</p>
                    <p>To continue using all features, please upgrade to a paid plan.</p>
                    <p><a href="${Deno.env.get("APP_URL") || "https://getstudioos.com"}/billing">Upgrade Now</a></p>
                    <p>— The StudioOS Team</p>
                  `,
                }),
              });
              results.trialExpiring++;
            } catch (emailError) {
              console.error("Email send error:", emailError);
            }
          }
        }
      }
    }

    // 2. Handle expired trials — downgrade to free
    const { data: expiredTrials } = await supabase
      .from("studios")
      .select("id")
      .eq("subscription_status", "trialing")
      .lte("trial_ends_at", now.toISOString());

    if (expiredTrials && expiredTrials.length > 0) {
      for (const studio of expiredTrials) {
        await supabase
          .from("studios")
          .update({
            subscription_status: "expired",
            subscription_tier: "free",
          })
          .eq("id", studio.id);
        results.trialExpired++;
      }
    }

    // 3. Handle expired grace periods — suspend access
    const { data: expiredGrace } = await supabase
      .from("studios")
      .select("id")
      .eq("subscription_status", "cancelled")
      .not("grace_period_ends_at", "is", null)
      .lte("grace_period_ends_at", now.toISOString());

    if (expiredGrace && expiredGrace.length > 0) {
      for (const studio of expiredGrace) {
        await supabase
          .from("studios")
          .update({
            subscription_status: "suspended",
            subscription_tier: "free",
          })
          .eq("id", studio.id);
        results.gracePeriodExpired++;
      }
    }

    return new Response(
      JSON.stringify({
        message: "Trial check complete",
        ...results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Trial reminders error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
