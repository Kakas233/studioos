"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, ChevronDown, ChevronUp } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  getShowType,
  getGranularBreakdown,
  fmtDuration,
  BREAK_SHOW_TYPES,
} from "@/lib/show-types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function buildSessions(stats: any[]) {
  const byModel: Record<string, any[]> = {};
  stats.forEach((stat) => {
    const key = stat.model_id;
    if (!byModel[key]) byModel[key] = [];
    byModel[key].push(stat);
  });

  const sessions: any[] = [];

  Object.entries(byModel).forEach(([modelId, modelStats]) => {
    const sorted = [...modelStats].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    let currentSession: any = null;

    sorted.forEach((stat) => {
      const totalOnline = stat.total_minutes || 0;
      if (totalOnline <= 0) {
        if (currentSession) {
          sessions.push(currentSession);
          currentSession = null;
        }
        return;
      }

      const breakdown = getGranularBreakdown(stat);
      const breakMins = stat.away_minutes || stat.break_minutes || 0;

      const dayData = {
        date: stat.date,
        totalOnline,
        breakMinutes: breakMins,
        totalMinutes: totalOnline + breakMins,
        segments: breakdown,
        estimatedEarnings: stat.estimated_earnings_usd || 0,
      };

      if (!currentSession) {
        currentSession = {
          modelId,
          startDate: stat.date,
          endDate: stat.date,
          days: [dayData],
          totalOnlineMinutes: totalOnline,
          totalBreakMinutes: breakMins,
          totalEarnings: stat.estimated_earnings_usd || 0,
        };
      } else {
        const prevDate = new Date(currentSession.endDate + "T00:00:00");
        const thisDate = new Date(stat.date + "T00:00:00");
        const diffDays = Math.round(
          (thisDate.getTime() - prevDate.getTime()) / 86400000
        );
        if (diffDays <= 1) {
          currentSession.endDate = stat.date;
          currentSession.days.push(dayData);
          currentSession.totalOnlineMinutes += totalOnline;
          currentSession.totalBreakMinutes += breakMins;
          currentSession.totalEarnings +=
            stat.estimated_earnings_usd || 0;
        } else {
          sessions.push(currentSession);
          currentSession = {
            modelId,
            startDate: stat.date,
            endDate: stat.date,
            days: [dayData],
            totalOnlineMinutes: totalOnline,
            totalBreakMinutes: breakMins,
            totalEarnings: stat.estimated_earnings_usd || 0,
          };
        }
      }
    });
    if (currentSession) sessions.push(currentSession);
  });

  return sessions.sort((a, b) => b.startDate.localeCompare(a.startDate));
}

function SessionCard({
  session,
  models,
}: {
  session: any;
  models: any[];
}) {
  const [expanded, setExpanded] = useState(false);
  const model = models.find((m: any) => m.id === session.modelId);
  const modelName = model?.first_name || "Unknown";
  const startFormatted = format(parseISO(session.startDate), "MMM d");
  const endFormatted = format(parseISO(session.endDate), "MMM d");
  const dateLabel =
    session.startDate === session.endDate
      ? startFormatted
      : `${startFormatted} - ${endFormatted}`;
  const efficiencyPct =
    session.totalOnlineMinutes > 0
      ? Math.round(
          (session.totalOnlineMinutes /
            (session.totalOnlineMinutes +
              session.totalBreakMinutes)) *
            100
        )
      : 0;

  const showBreakdown: Record<string, number> = {};
  session.days.forEach((day: any) => {
    day.segments.forEach((seg: any) => {
      const showType = seg.type || seg.showType;
      if (!showBreakdown[showType]) showBreakdown[showType] = 0;
      showBreakdown[showType] += seg.minutes;
    });
  });

  const totalBarMinutes =
    session.totalOnlineMinutes + session.totalBreakMinutes;

  return (
    <div className="bg-[#111111] border border-white/[0.04] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-[#C9A84C]" />
          </div>
          <div className="text-left min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-white">{modelName}</p>
              <span className="text-xs text-[#A8A49A]/30">&bull;</span>
              <p className="text-xs text-[#A8A49A]/50">{dateLabel}</p>
              {session.days.length > 1 && (
                <Badge
                  variant="outline"
                  className="text-[9px] px-1.5 py-0 bg-white/[0.03] text-white/40 border-white/[0.06]"
                >
                  {session.days.length} days
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-emerald-400">
                {fmtDuration(session.totalOnlineMinutes)} online
              </span>
              {session.totalBreakMinutes > 0 && (
                <span className="text-xs text-orange-400/60">
                  {fmtDuration(session.totalBreakMinutes)} break
                </span>
              )}
              <span className="text-[10px] text-[#A8A49A]/30">
                {efficiencyPct}% efficiency
              </span>
            </div>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-[#A8A49A]/30" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#A8A49A]/30" />
        )}
      </button>

      <div className="px-4 pb-3">
        <div className="h-2 rounded-full bg-white/[0.03] flex overflow-hidden">
          {Object.entries(showBreakdown)
            .sort((a, b) => b[1] - a[1])
            .map(([type, mins]) => {
              const cfg = getShowType(type);
              const isBreak = BREAK_SHOW_TYPES.has(type as any);
              return (
                <div
                  key={type}
                  className={`${cfg.bar} h-full transition-all`}
                  style={{
                    width: `${
                      totalBarMinutes > 0
                        ? (mins / totalBarMinutes) * 100
                        : 0
                    }%`,
                    opacity: isBreak ? 0.4 : 0.7,
                  }}
                  title={`${cfg.label}: ${fmtDuration(mins)}`}
                />
              );
            })}
        </div>
        <div className="flex items-center gap-3 mt-2">
          {Object.entries(showBreakdown)
            .sort((a, b) => b[1] - a[1])
            .map(([type, mins]) => {
              const cfg = getShowType(type);
              const isBreak = BREAK_SHOW_TYPES.has(type as any);
              return (
                <div key={type} className="flex items-center gap-1">
                  <div
                    className={`w-2 h-2 rounded-full ${cfg.bar}`}
                    style={{ opacity: isBreak ? 0.4 : 0.7 }}
                  />
                  <span className="text-[9px] text-[#A8A49A]/40">
                    {cfg.label} {fmtDuration(mins)}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-white/[0.04]">
          {session.days.map((day: any, i: number) => (
            <div
              key={i}
              className={`px-4 py-3 ${
                i > 0 ? "border-t border-white/[0.03]" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-white/70">
                  {format(parseISO(day.date), "EEEE, MMM d")}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-emerald-400/70">
                    {fmtDuration(day.totalOnline)} online
                  </span>
                  {day.breakMinutes > 0 && (
                    <span className="text-[10px] text-orange-400/50">
                      {fmtDuration(day.breakMinutes)} break
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 flex-wrap">
                {day.segments.map((seg: any, si: number) => {
                  const Icon = seg.config?.icon || seg.icon;
                  const color = seg.config?.color || seg.color;
                  const bg = seg.config?.bg || seg.bg;
                  const label = seg.config?.label || seg.label;
                  return (
                    <div
                      key={si}
                      className={`${bg} rounded-lg px-2.5 py-1.5 flex items-center gap-1.5`}
                    >
                      {Icon && <Icon className={`w-3 h-3 ${color}`} />}
                      <span
                        className={`text-[10px] font-medium ${color}`}
                      >
                        {label}
                      </span>
                      <span className="text-[10px] text-white/30 ml-0.5">
                        {fmtDuration(seg.minutes)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.02] flex overflow-hidden mt-2">
                {day.segments.map((seg: any, si: number) => {
                  const showType = seg.type || seg.showType;
                  const bar = seg.config?.bar || seg.bar;
                  const isBreak = BREAK_SHOW_TYPES.has(showType as any);
                  return (
                    <div
                      key={si}
                      className={`${bar} h-full`}
                      style={{
                        width: `${
                          day.totalMinutes > 0
                            ? (seg.minutes / day.totalMinutes) * 100
                            : 0
                        }%`,
                        opacity: isBreak ? 0.3 : 0.6,
                      }}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface SessionBreakdownProps {
  stats: any[];
  models: any[];
}

export default function SessionBreakdown({
  stats,
  models,
}: SessionBreakdownProps) {
  const [showAll, setShowAll] = useState(false);
  const sessions = useMemo(() => buildSessions(stats), [stats]);
  const displaySessions = showAll ? sessions : sessions.slice(0, 5);

  if (sessions.length === 0) {
    return (
      <Card className="bg-[#111111]/80 border-white/[0.04]">
        <CardContent className="p-8 text-center">
          <Activity className="w-8 h-8 text-[#A8A49A]/20 mx-auto mb-3" />
          <p className="text-sm text-[#A8A49A]/30">
            No streaming sessions found in the selected date range
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-white/70">
            Session Breakdown
          </h3>
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 py-0 bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/20"
          >
            {sessions.length} sessions
          </Badge>
        </div>
      </div>
      <div className="space-y-2">
        {displaySessions.map((session, i) => (
          <SessionCard
            key={`${session.modelId}-${session.startDate}-${i}`}
            session={session}
            models={models}
          />
        ))}
      </div>
      {sessions.length > 5 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="w-full text-[#A8A49A]/40 hover:text-white text-xs"
        >
          {showAll ? "Show Less" : `Show All ${sessions.length} Sessions`}
        </Button>
      )}
    </div>
  );
}
