// Supabase Edge Function: correlate-shifts
// Runs hourly via pg_cron to analyze shift adherence
// Compares scheduled shifts against actual streaming data

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

    // Get completed shifts from last 24 hours that haven't been analyzed yet
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: shifts, error: shiftsError } = await supabase
      .from("shifts")
      .select("id, studio_id, model_id, start_time, end_time, status")
      .eq("status", "completed")
      .gte("end_time", twentyFourHoursAgo);

    if (shiftsError) throw shiftsError;
    if (!shifts || shifts.length === 0) {
      return new Response(
        JSON.stringify({ message: "No completed shifts to analyze" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check which shifts already have analyses
    const shiftIds = shifts.map((s) => s.id);
    const { data: existingAnalyses } = await supabase
      .from("shift_analyses")
      .select("shift_id")
      .in("shift_id", shiftIds);

    const analyzedShiftIds = new Set(existingAnalyses?.map((a) => a.shift_id) || []);
    const unanalyzedShifts = shifts.filter((s) => !analyzedShiftIds.has(s.id));

    if (unanalyzedShifts.length === 0) {
      return new Response(
        JSON.stringify({ message: "All recent shifts already analyzed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let analyzedCount = 0;

    for (const shift of unanalyzedShifts) {
      try {
        const shiftDate = shift.start_time.split("T")[0];
        const scheduledStart = new Date(shift.start_time);
        const scheduledEnd = new Date(shift.end_time);
        const scheduledDuration =
          (scheduledEnd.getTime() - scheduledStart.getTime()) / (1000 * 60);

        // Get cam accounts for this model
        const { data: camAccounts } = await supabase
          .from("cam_accounts")
          .select("id, platform")
          .eq("model_id", shift.model_id)
          .eq("studio_id", shift.studio_id)
          .eq("is_active", true);

        if (!camAccounts || camAccounts.length === 0) continue;

        const camAccountIds = camAccounts.map((ca) => ca.id);

        // Get stream segments for this shift's date
        const { data: segments } = await supabase
          .from("stream_segments")
          .select("start_time, end_time, duration_minutes, platform")
          .eq("model_id", shift.model_id)
          .eq("date", shiftDate)
          .in("cam_account_id", camAccountIds)
          .order("start_time");

        const totalOnlineMinutes = segments?.reduce(
          (sum, s) => sum + (s.duration_minutes || 0),
          0
        ) || 0;

        // Calculate adherence metrics
        let actualStart: string | null = null;
        let actualEnd: string | null = null;
        let lateStartMinutes = 0;
        let earlyEndMinutes = 0;

        if (segments && segments.length > 0) {
          actualStart = segments[0].start_time;
          actualEnd = segments[segments.length - 1].end_time;

          const actualStartTime = new Date(actualStart);
          const actualEndTime = new Date(actualEnd);

          if (actualStartTime > scheduledStart) {
            lateStartMinutes = Math.round(
              (actualStartTime.getTime() - scheduledStart.getTime()) / (1000 * 60)
            );
          }

          if (actualEndTime < scheduledEnd) {
            earlyEndMinutes = Math.round(
              (scheduledEnd.getTime() - actualEndTime.getTime()) / (1000 * 60)
            );
          }
        }

        // Calculate adherence percentage
        const adherence = scheduledDuration > 0
          ? Math.min(100, Math.round((totalOnlineMinutes / scheduledDuration) * 100))
          : 0;

        // Calculate break time (scheduled time - online time, if less)
        const totalBreakMinutes = Math.max(0, scheduledDuration - totalOnlineMinutes);

        const platformsUsed = [
          ...new Set(segments?.map((s) => s.platform).filter(Boolean) || []),
        ];

        // Insert shift analysis
        await supabase.from("shift_analyses").insert({
          studio_id: shift.studio_id,
          shift_id: shift.id,
          model_id: shift.model_id,
          scheduled_start: shift.start_time,
          scheduled_end: shift.end_time,
          shift_date: shiftDate,
          adherence_percentage: adherence,
          late_start_minutes: lateStartMinutes,
          early_end_minutes: earlyEndMinutes,
          total_online_minutes: totalOnlineMinutes,
          total_break_minutes: totalBreakMinutes,
          actual_start: actualStart,
          actual_end: actualEnd,
          segment_count: segments?.length || 0,
          platforms_used: platformsUsed,
        });

        analyzedCount++;
      } catch (shiftError) {
        console.error(`Error analyzing shift ${shift.id}:`, shiftError);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Analyzed ${analyzedCount} shifts`,
        total_shifts: shifts.length,
        already_analyzed: shifts.length - unanalyzedShifts.length,
        newly_analyzed: analyzedCount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Correlate shifts error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
