"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Clock } from "lucide-react";
import { format } from "date-fns";

const SHOW_COLORS: Record<string, string> = {
  public: "#10b981", private: "#8b5cf6", group: "#f59e0b", hidden: "#6b7280", p2p: "#ec4899", spy: "#06b6d4",
};

interface MLTimelineTabProps {
  site: string;
  name: string;
  dateRange: { start: string; end: string };
}

export default function MLTimelineTab({ site, name, dateRange }: MLTimelineTabProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  useEffect(() => { loadSessions(); }, [site, name, dateRange]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lookup/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sessions",
          site,
          name,
          range: [dateRange.start, dateRange.end],
          per_page: 200,
          window: 2,
        }),
      });
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error("Timeline error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-[#C9A84C] animate-spin" /></div>;
  if (!sessions.length) return <div className="text-center py-8 text-[#A8A49A]/30 text-sm">No timeline data available</div>;

  // Group sessions by date
  const dayMap: Record<string, { sessions: any[]; totalMin: number }> = {};
  sessions.forEach((s: any) => {
    const start = new Date(s.start_time);
    const end = new Date(s.end_time);
    const dayKey = format(start, "yyyy-MM-dd");
    if (!dayMap[dayKey]) dayMap[dayKey] = { sessions: [], totalMin: 0 };
    const durationMin = (end.getTime() - start.getTime()) / 60000;
    dayMap[dayKey].sessions.push({ ...s, startDate: start, endDate: end, durationMin });
    dayMap[dayKey].totalMin += durationMin;
  });

  const sortedDays = Object.keys(dayMap).sort((a, b) => b.localeCompare(a));
  const totalSessions = sessions.length;
  const totalDays = sortedDays.length;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between text-xs text-[#A8A49A]/50 px-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Public ({totalSessions})</span>
        </div>
        <span>{totalDays} days · {totalSessions} entries</span>
      </div>

      <Card className="bg-[#111111] border-white/[0.04]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" /> Session Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="space-y-1">
            {sortedDays.map((dayKey) => {
              const day = dayMap[dayKey];
              const hours = Math.floor(day.totalMin / 60);
              const mins = Math.round(day.totalMin % 60);
              const isExpanded = expandedDay === dayKey;

              return (
                <div key={dayKey}>
                  <button
                    className="flex items-center gap-3 w-full hover:bg-white/[0.02] rounded px-1 py-1.5 transition-colors group"
                    onClick={() => setExpandedDay(isExpanded ? null : dayKey)}
                  >
                    <span className="text-xs text-[#A8A49A]/50 w-14 shrink-0 text-left">
                      {format(new Date(dayKey + "T12:00:00"), "MMM dd")}
                    </span>
                    {/* 24h bar */}
                    <div className="flex-1 h-5 bg-white/[0.02] rounded-sm overflow-hidden relative">
                      {day.sessions.map((s: any, i: number) => {
                        const startHour = s.startDate.getHours() + s.startDate.getMinutes() / 60;
                        const endRaw = s.endDate.getHours() + s.endDate.getMinutes() / 60;
                        const sameDayEnd = s.endDate.toDateString() === s.startDate.toDateString();
                        const endHour = sameDayEnd ? endRaw : 24;
                        const left = (startHour / 24) * 100;
                        const width = Math.max(((endHour - startHour) / 24) * 100, 0.5);
                        return (
                          <div
                            key={i}
                            className="absolute top-0 h-full rounded-sm"
                            style={{
                              left: `${left}%`,
                              width: `${width}%`,
                              backgroundColor: SHOW_COLORS.public,
                            }}
                          />
                        );
                      })}
                    </div>
                    <span className="text-xs text-white/50 w-16 text-right shrink-0">{hours}h {mins}m</span>
                  </button>

                  {/* Expanded session details */}
                  {isExpanded && (
                    <div className="ml-[4.5rem] mb-2 space-y-1 pl-2 border-l border-white/[0.04]">
                      {day.sessions.map((s: any, i: number) => (
                        <div key={i} className="flex items-center gap-2 text-xs py-0.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                          <span className="text-white/60">
                            {format(s.startDate, "HH:mm")} - {format(s.endDate, "HH:mm")}
                          </span>
                          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-1.5 py-0.5 rounded font-medium">Public</span>
                          <span className="text-[#A8A49A]/40">~{hours > 0 ? `${Math.floor(s.durationMin / 60)}h ` : ""}{Math.round(s.durationMin % 60)}m</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Time axis labels */}
          <div className="flex items-center gap-3 mt-3 pt-2 border-t border-white/[0.04]">
            <span className="w-14 shrink-0" />
            <div className="flex-1 flex justify-between text-[9px] text-[#A8A49A]/25">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>
            <span className="w-16 shrink-0" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
