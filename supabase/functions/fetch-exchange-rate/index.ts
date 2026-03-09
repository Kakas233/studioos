// Supabase Edge Function: fetch-exchange-rate
// Runs daily via pg_cron to update exchange rates for all studios with auto mode

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

    // Get all studios with auto exchange rate mode
    const { data: settings, error } = await supabase
      .from("global_settings")
      .select("id, studio_id, secondary_currency, exchange_rate_mode")
      .eq("exchange_rate_mode", "auto");

    if (error) throw error;
    if (!settings || settings.length === 0) {
      return new Response(
        JSON.stringify({ message: "No studios with auto exchange rate" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get unique currencies to fetch
    const currencies = [...new Set(settings.map((s) => s.secondary_currency).filter(Boolean))];
    const rates: Record<string, number> = {};

    // Fetch exchange rates from a free API
    for (const currency of currencies) {
      try {
        const res = await fetch(
          `https://api.exchangerate-api.com/v4/latest/USD`,
          { signal: AbortSignal.timeout(10000) }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.rates && data.rates[currency]) {
            rates[currency] = data.rates[currency];
          }
        }
        // Only need one request since we're getting all rates from USD
        break;
      } catch (fetchError) {
        console.error(`Failed to fetch exchange rate for ${currency}:`, fetchError);
      }
    }

    // Update studios with new rates
    let updatedCount = 0;
    for (const setting of settings) {
      const currency = setting.secondary_currency;
      if (currency && rates[currency]) {
        await supabase
          .from("global_settings")
          .update({ exchange_rate: rates[currency] })
          .eq("id", setting.id);
        updatedCount++;
      }
    }

    return new Response(
      JSON.stringify({
        message: `Updated ${updatedCount} exchange rates`,
        rates,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Exchange rate function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
