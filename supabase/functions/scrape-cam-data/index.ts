// Supabase Edge Function: scrape-cam-data
// Runs every 15 minutes via pg_cron to check which models are currently live
// and update streaming_sessions + daily_stream_stats

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

    // Get all active cam accounts with their studio info
    const { data: camAccounts, error: camError } = await supabase
      .from("cam_accounts")
      .select("id, studio_id, model_id, platform, username")
      .eq("is_active", true);

    if (camError) throw camError;
    if (!camAccounts || camAccounts.length === 0) {
      return new Response(JSON.stringify({ message: "No active cam accounts" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const vpsUrl = Deno.env.get("VPS_URL");
    if (!vpsUrl) {
      return new Response(JSON.stringify({ error: "VPS_URL not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let updatedCount = 0;
    const now = new Date().toISOString();
    const today = now.split("T")[0];

    for (const cam of camAccounts) {
      if (!cam.username) continue;

      try {
        // Call VPS scraper endpoint for this cam account
        const scrapeRes = await fetch(
          `${vpsUrl}/api/scrape?platform=${cam.platform}&username=${cam.username}`,
          {
            headers: { "X-API-Key": Deno.env.get("VPS_API_KEY") || "" },
            signal: AbortSignal.timeout(10000),
          }
        );

        if (!scrapeRes.ok) continue;

        const scrapeData = await scrapeRes.json();
        const isLive = scrapeData.is_live || false;
        const showType = scrapeData.show_type || "offline";

        // Upsert streaming session
        await supabase
          .from("streaming_sessions")
          .upsert(
            {
              studio_id: cam.studio_id,
              cam_account_id: cam.id,
              is_currently_live: isLive,
              show_type: isLive ? showType : "offline",
              scraped_at: now,
            },
            { onConflict: "cam_account_id" }
          );

        // If live, update daily stats (add 15 minutes to the appropriate show type)
        if (isLive) {
          const showTypeColumn = getShowTypeColumn(showType);

          // Get or create today's stats row
          const { data: existingStats } = await supabase
            .from("daily_stream_stats")
            .select("id, total_minutes, " + showTypeColumn)
            .eq("cam_account_id", cam.id)
            .eq("date", today)
            .single();

          if (existingStats) {
            const update: Record<string, number> = {
              total_minutes: (existingStats.total_minutes || 0) + 15,
            };
            update[showTypeColumn] =
              ((existingStats as Record<string, number>)[showTypeColumn] || 0) + 15;

            await supabase
              .from("daily_stream_stats")
              .update(update)
              .eq("id", existingStats.id);
          } else {
            const insert: Record<string, unknown> = {
              studio_id: cam.studio_id,
              cam_account_id: cam.id,
              model_id: cam.model_id,
              date: today,
              platform: cam.platform,
              total_minutes: 15,
              unique_minutes: 15,
            };
            insert[showTypeColumn] = 15;

            await supabase.from("daily_stream_stats").insert(insert);
          }

          updatedCount++;
        }
      } catch (scrapeError) {
        // Log individual scrape errors but continue
        console.error(`Scrape error for ${cam.platform}/${cam.username}:`, scrapeError);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Scrape complete. Updated ${updatedCount} live sessions.`,
        total_accounts: camAccounts.length,
        live_count: updatedCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Scrape function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getShowTypeColumn(showType: string): string {
  const mapping: Record<string, string> = {
    free_chat: "free_chat_minutes",
    private_chat: "private_chat_minutes",
    group_chat: "group_chat_minutes",
    true_private: "true_private_minutes",
    spy_show: "spy_show_minutes",
    ticket_show: "ticket_show_minutes",
    club_show: "club_show_minutes",
    happy_hour: "happy_hour_minutes",
    away: "away_minutes",
    idle: "idle_minutes",
    p2p: "p2p_minutes",
    voyeur: "voyeur_minutes",
    exclusive: "exclusive_minutes",
    cam2cam: "cam2cam_minutes",
  };
  return mapping[showType] || "free_chat_minutes";
}
