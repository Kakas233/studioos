"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target, TrendingDown, Calendar, Clock, Flame } from "lucide-react";
import { parseISO, startOfWeek, endOfWeek, addWeeks, isWithinInterval, differenceInMinutes } from "date-fns";
import type { Database } from "@/lib/supabase/types";

type Shift = Database["public"]["Tables"]["shifts"]["Row"];

interface WeeklyGoalProps {
  shifts: Shift[];
  targetHours: number;
  enabled?: boolean;
}

export default function WeeklyGoal({ shifts, targetHours = 20, enabled = true }: WeeklyGoalProps) {
  if (!enabled) return null;

  const now = new Date();
  const nextWeekStart = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
  const nextWeekEnd = endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });

  // Current week
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const isActiveShift = (shift: Shift) =>
    shift.status !== "cancelled" && shift.status !== "no_show";

  const nextWeekShifts = shifts.filter((shift) => {
    try {
      if (!isActiveShift(shift)) return false;
      const start = parseISO(shift.start_time);
      return isWithinInterval(start, { start: nextWeekStart, end: nextWeekEnd });
    } catch { return false; }
  });

  const currentWeekShifts = shifts.filter((shift) => {
    try {
      if (!isActiveShift(shift)) return false;
      const start = parseISO(shift.start_time);
      return isWithinInterval(start, { start: currentWeekStart, end: currentWeekEnd });
    } catch { return false; }
  });

  const bookedHoursNext = Math.round(nextWeekShifts.reduce((total, shift) => {
    try {
      return total + differenceInMinutes(parseISO(shift.end_time), parseISO(shift.start_time)) / 60;
    } catch { return total; }
  }, 0) * 10) / 10;

  const bookedHoursThis = Math.round(currentWeekShifts.reduce((total, shift) => {
    try {
      return total + differenceInMinutes(parseISO(shift.end_time), parseISO(shift.start_time)) / 60;
    } catch { return total; }
  }, 0) * 10) / 10;

  const percentageNext = Math.min((bookedHoursNext / targetHours) * 100, 100);
  const isOnTrack = bookedHoursNext >= targetHours;
  const hoursShort = targetHours - bookedHoursNext;

  return (
    <Card className="bg-gradient-to-br from-[#111111] to-[#0D0D0D] border-white/[0.04] overflow-hidden relative">
      {/* Decorative background glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 ${isOnTrack ? "bg-emerald-500" : "bg-amber-500"}`} />

      <CardContent className="p-5 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isOnTrack ? "bg-emerald-500/10" : "bg-amber-500/10"}`}>
            <Target className={`w-4.5 h-4.5 ${isOnTrack ? "text-emerald-400" : "text-amber-400"}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Weekly Stream Goal</h3>
            <p className="text-[10px] text-[#A8A49A]/30">{targetHours}h target per week</p>
          </div>
        </div>

        {/* Main stat */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-light text-white tracking-tight">{bookedHoursNext}h</span>
              <span className="text-sm text-[#A8A49A]/30 font-light">/ {targetHours}h</span>
            </div>
            <p className="text-xs text-[#A8A49A]/30 mt-0.5">Next week</p>
          </div>
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
            isOnTrack
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
              : "bg-amber-500/10 text-amber-400 border border-amber-500/15"
          }`}>
            {isOnTrack ? (
              <><Flame className="w-3 h-3" /> On Track</>
            ) : (
              <><TrendingDown className="w-3 h-3" /> {hoursShort}h Short</>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5 mb-4">
          <Progress
            value={percentageNext}
            className={`h-2.5 bg-white/[0.04] rounded-full ${isOnTrack ? "[&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-emerald-400" : "[&>div]:bg-gradient-to-r [&>div]:from-amber-500 [&>div]:to-amber-400"}`}
          />
          <div className="flex justify-between text-[10px] text-[#A8A49A]/20">
            <span>0h</span>
            <span>{Math.round(percentageNext)}%</span>
            <span>{targetHours}h</span>
          </div>
        </div>

        {/* Footer stats */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/[0.04]">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#A8A49A]/25" />
            <div>
              <p className="text-xs text-white font-medium">{nextWeekShifts.length}</p>
              <p className="text-[9px] text-[#A8A49A]/25">Sessions next week</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#A8A49A]/25" />
            <div>
              <p className="text-xs text-white font-medium">{bookedHoursThis}h</p>
              <p className="text-[9px] text-[#A8A49A]/25">This week so far</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
