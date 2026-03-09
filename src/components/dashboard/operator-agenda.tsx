"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, ChevronRight } from "lucide-react";
import { format, parseISO, isAfter, differenceInHours, differenceInMinutes } from "date-fns";
import { useStudioAccounts } from "@/hooks/use-studio-data";
import type { Database } from "@/lib/supabase/types";

type Shift = Database["public"]["Tables"]["shifts"]["Row"];

interface OperatorAgendaProps {
  shifts: Shift[];
}

const statusColors: Record<string, string> = {
  scheduled: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  completed: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  no_show: "bg-red-500/15 text-red-200 border-red-500/30",
};

export default function OperatorAgenda({ shifts }: OperatorAgendaProps) {
  const now = new Date();
  const { data: accounts = [] } = useStudioAccounts();

  const getModelName = (modelId: string) => {
    const account = accounts.find((a) => a.id === modelId);
    return account?.first_name || "Unknown";
  };

  const upcomingShifts = shifts
    .filter((shift) => isAfter(parseISO(shift.start_time), now))
    .sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime())
    .slice(0, 8);

  const getTimeUntil = (startTime: string) => {
    const start = parseISO(startTime);
    const hours = differenceInHours(start, now);
    const mins = differenceInMinutes(start, now) % 60;
    if (hours < 24) {
      return hours > 0 ? `in ${hours}h ${mins}m` : `in ${mins}m`;
    }
    return format(start, "EEE, MMM d");
  };

  return (
    <Card className="bg-[#111111]/80 border-white/[0.04]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg font-medium text-white flex items-center gap-2">
            <Calendar className="w-4 sm:w-5 h-4 sm:h-5 text-amber-400" />
            Upcoming Sessions
          </CardTitle>
          <Link
            href="/schedule"
            className="text-sm text-[#C9A84C] hover:underline flex items-center gap-1"
          >
            View All <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {upcomingShifts.length === 0 ? (
          <div className="text-center py-8 text-[#A8A49A]/30">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No upcoming sessions</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingShifts.map((shift) => {
              const start = parseISO(shift.start_time);
              const end = parseISO(shift.end_time);
              const duration = differenceInHours(end, start);

              return (
                <div
                  key={shift.id}
                  className="flex items-center justify-between p-2.5 sm:p-3 bg-white/[0.03] rounded-lg hover:bg-white/[0.05] transition-colors"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/[0.04] rounded-lg flex items-center justify-center border border-white/[0.04] shrink-0">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#A8A49A]/40" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-white truncate">{getModelName(shift.model_id)}</p>
                      <div className="flex items-center gap-1.5 text-xs text-[#A8A49A]/40">
                        <Clock className="w-3 h-3 shrink-0" />
                        <span>{format(start, "HH:mm")}{"\u2013"}{format(end, "HH:mm")}</span>
                        <span className="text-[#A8A49A]/20 hidden sm:inline">({duration}h)</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <Badge variant="outline" className={`${statusColors[shift.status] || statusColors.scheduled} text-[10px] sm:text-xs`}>
                      {shift.status}
                    </Badge>
                    <p className="text-[10px] text-[#A8A49A]/30 mt-0.5">
                      {getTimeUntil(shift.start_time)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
