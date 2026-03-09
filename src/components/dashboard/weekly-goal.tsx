"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  TrendingDown,
  Calendar,
  Clock,
  Flame,
} from "lucide-react";
import {
  parseISO,
  startOfWeek,
  endOfWeek,
  addWeeks,
  isWithinInterval,
  differenceInMinutes,
} from "date-fns";
import type { Database } from "@/lib/supabase/types";

type Shift = Database["public"]["Tables"]["shifts"]["Row"];

interface WeeklyGoalProps {
  shifts: Shift[];
  targetHours: number;
  enabled?: boolean;
}

export default function WeeklyGoal({
  shifts,
  targetHours = 20,
  enabled = true,
}: WeeklyGoalProps) {
  if (!enabled) return null;

  const now = new Date();

  // Fix #14: Use differenceInMinutes / 60 for decimal precision
  const calcHours = (shiftList: Shift[]) =>
    shiftList.reduce((total, shift) => {
      try {
        return (
          total +
          differenceInMinutes(
            parseISO(shift.end_time),
            parseISO(shift.start_time)
          ) / 60
        );
      } catch {
        return total;
      }
    }, 0);

  const nextWeekStart = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
  const nextWeekEnd = endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const nextWeekShifts = shifts.filter((shift) => {
    try {
      return isWithinInterval(parseISO(shift.start_time), {
        start: nextWeekStart,
        end: nextWeekEnd,
      });
    } catch {
      return false;
    }
  });

  const currentWeekShifts = shifts.filter((shift) => {
    try {
      return isWithinInterval(parseISO(shift.start_time), {
        start: currentWeekStart,
        end: currentWeekEnd,
      });
    } catch {
      return false;
    }
  });

  const bookedHoursNext = Math.round(calcHours(nextWeekShifts) * 10) / 10;
  const bookedHoursThis = Math.round(calcHours(currentWeekShifts) * 10) / 10;

  const percentageNext = Math.min(
    (bookedHoursNext / targetHours) * 100,
    100
  );
  const isOnTrack = bookedHoursNext >= targetHours;
  const hoursShort = Math.round((targetHours - bookedHoursNext) * 10) / 10;

  return (
    <Card className="bg-gradient-to-br from-[#111111] to-[#0D0D0D] border-white/[0.04] overflow-hidden relative">
      <div
        className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 ${
          isOnTrack ? "bg-emerald-500" : "bg-amber-500"
        }`}
      />

      <CardContent className="p-5 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2.5 mb-5">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isOnTrack ? "bg-emerald-500/10" : "bg-amber-500/10"
            }`}
          >
            <Target
              className={`w-4 h-4 ${
                isOnTrack ? "text-emerald-400" : "text-amber-400"
              }`}
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Weekly Stream Goal
            </h3>
            <p className="text-[10px] text-[#A8A49A]/30">
              {targetHours}h target per week
            </p>
          </div>
        </div>

        {/* Main stat */}
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-light text-white tracking-tight">
                {bookedHoursNext}h
              </span>
              <span className="text-sm text-[#A8A49A]/30 font-light">
                / {targetHours}h
              </span>
            </div>
            <p className="text-xs text-[#A8A49A]/30 mt-0.5">Next week</p>
          </div>
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
              isOnTrack
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/15"
            }`}
          >
            {isOnTrack ? (
              <>
                <Flame className="w-3 h-3" /> On Track
              </>
            ) : (
              <>
                <TrendingDown className="w-3 h-3" /> {hoursShort}h Short
              </>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5 mb-4">
          <Progress
            value={percentageNext}
            className="h-2.5 bg-white/[0.04] rounded-full"
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
              <p className="text-xs text-white font-medium">
                {nextWeekShifts.length}
              </p>
              <p className="text-[9px] text-[#A8A49A]/25">
                Sessions next week
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-[#A8A49A]/25" />
            <div>
              <p className="text-xs text-white font-medium">
                {bookedHoursThis}h
              </p>
              <p className="text-[9px] text-[#A8A49A]/25">
                This week so far
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
