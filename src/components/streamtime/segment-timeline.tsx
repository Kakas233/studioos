"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  Moon,
  Coffee,
  Play,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { mergeSegmentsByPlatform } from "./merge-segments";
import {
  getShowType,
  fmtDuration,
  ONLINE_SHOW_TYPES,
  BREAK_SHOW_TYPES,
} from "@/lib/show-types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function fmtTime(isoStr: string | undefined | null): string {
  if (!isoStr) return "--:--";
  return format(parseISO(isoStr), "HH:mm");
}

/** Detect session boundaries from a flat list of segments.
 *  A new session starts when there's an offline gap > gapMinutes
 *  or when a new shift starts after an offline period. */
export function detectSessions(
  segments: any[],
  shifts: any[],
  gapMinutes = 45,
): { sessionSegments: any[]; sessionStart: string; sessionEnd: string; shiftMatch?: any }[] {
  if (!segments || segments.length === 0) return [];

  const sorted = [...segments].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  const sessions: {
    sessionSegments: any[];
    sessionStart: string;
    sessionEnd: string;
    shiftMatch?: any;
  }[] = [];

  let currentSession: any[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const prevEnd = new Date(prev.end_time).getTime();
    const currStart = new Date(curr.start_time).getTime();
    const gapMs = currStart - prevEnd;
    const gapMins = gapMs / 60000;

    // Check if a shift boundary falls in this gap
    const hasShiftBoundary = shifts?.some((s: any) => {
      const shiftStart = new Date(s.start_time).getTime();
      return shiftStart > prevEnd && shiftStart <= currStart;
    });

    // Split into new session if gap is large enough or shift boundary exists
    if (gapMins > gapMinutes || (gapMins > 15 && hasShiftBoundary)) {
      const firstSeg = currentSession[0];
      const lastSeg = currentSession[currentSession.length - 1];
      sessions.push({
        sessionSegments: currentSession,
        sessionStart: firstSeg.start_time,
        sessionEnd: lastSeg.end_time,
      });
      currentSession = [curr];
    } else {
      currentSession.push(curr);
    }
  }

  // Push the last session
  if (currentSession.length > 0) {
    const firstSeg = currentSession[0];
    const lastSeg = currentSession[currentSession.length - 1];
    sessions.push({
      sessionSegments: currentSession,
      sessionStart: firstSeg.start_time,
      sessionEnd: lastSeg.end_time,
    });
  }

  // Match sessions to shifts
  for (const session of sessions) {
    const sessionStartMs = new Date(session.sessionStart).getTime();
    const sessionEndMs = new Date(session.sessionEnd).getTime();
    const match = shifts?.find((s: any) => {
      const ss = new Date(s.start_time).getTime();
      const se = new Date(s.end_time).getTime();
      // Shift overlaps session by at least some time
      return ss < sessionEndMs && se > sessionStartMs;
    });
    if (match) session.shiftMatch = match;
  }

  return sessions;
}

interface SegmentTimelineProps {
  date: string;
  modelId: string;
  segments: any[];
  models: any[];
  shifts?: any[];
  shiftAnalysis?: any;
}

export default function SegmentTimeline({
  date,
  modelId,
  segments,
  models,
  shifts,
  shiftAnalysis,
}: SegmentTimelineProps) {
  const [expanded, setExpanded] = useState(false);
  const modelName =
    models?.find((m: any) => m.id === modelId)?.first_name || "Unknown";

  // Include ALL segments (online, break, offline, away)
  const allSegments = useMemo(() => {
    const all = [...segments];
    all.sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
    return all;
  }, [segments]);

  const byPlatform = useMemo(
    () => mergeSegmentsByPlatform(segments),
    [segments]
  );

  // Calculate time breakdowns
  const breakdown: Record<string, number> = {};
  let totalOnline = 0;
  let totalBreak = 0;
  let totalOffline = 0;
  allSegments.forEach((seg) => {
    const mins = seg.duration_minutes || 0;
    if (!breakdown[seg.show_type]) breakdown[seg.show_type] = 0;
    breakdown[seg.show_type] += mins;
    if (ONLINE_SHOW_TYPES.has(seg.show_type as any)) totalOnline += mins;
    if (BREAK_SHOW_TYPES.has(seg.show_type as any)) totalBreak += mins;
    if (seg.show_type === "offline") totalOffline += mins;
  });

  const firstStart = allSegments[0] ? new Date(allSegments[0].start_time) : null;
  const lastEnd = allSegments[allSegments.length - 1]
    ? new Date(allSegments[allSegments.length - 1].end_time)
    : null;
  const timelineSpan =
    firstStart && lastEnd
      ? lastEnd.getTime() - firstStart.getTime()
      : 0;

  // Adherence from shift analysis if available
  const adherence = shiftAnalysis?.adherence_percentage;
  const adherenceColor =
    adherence != null
      ? adherence >= 85
        ? "text-emerald-400"
        : adherence >= 60
        ? "text-amber-400"
        : "text-red-400"
      : null;

  // Detect sessions within this day's data
  const daySessions = useMemo(
    () => detectSessions(allSegments, shifts || [], 45),
    [allSegments, shifts]
  );

  return (
    <div className="bg-[#111111] border border-white/[0.04] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-[#C9A84C]" />
          </div>
          <div className="text-left min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-white">{modelName}</p>
              <span className="text-xs text-[#A8A49A]/30">&bull;</span>
              <p className="text-xs text-[#A8A49A]/50">
                {format(parseISO(date), "EEEE, MMM d")}
              </p>
              <div className="flex gap-1">
                {Object.keys(byPlatform).map((p) => (
                  <Badge
                    key={p}
                    variant="outline"
                    className="text-[8px] px-1 py-0 bg-white/[0.03] text-white/40 border-white/[0.06]"
                  >
                    {p}
                  </Badge>
                ))}
              </div>
              {daySessions.length > 1 && (
                <Badge
                  variant="outline"
                  className="text-[8px] px-1 py-0 bg-violet-500/10 text-violet-400 border-violet-500/20"
                >
                  {daySessions.length} sessions
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              {firstStart && (
                <span className="text-[10px] text-[#A8A49A]/40">
                  {fmtTime(allSegments[0].start_time)} -{" "}
                  {fmtTime(allSegments[allSegments.length - 1].end_time)}
                </span>
              )}
              <span className="text-xs text-emerald-400">
                {fmtDuration(totalOnline)} online
              </span>
              {totalBreak > 0 && (
                <span className="text-xs text-orange-400/60">
                  {fmtDuration(totalBreak)} break
                </span>
              )}
              {totalOffline > 0 && (
                <span className="text-xs text-zinc-500/60">
                  {fmtDuration(totalOffline)} offline
                </span>
              )}
              {adherence != null && (
                <span className={`text-xs font-semibold ${adherenceColor}`}>
                  {adherence}%
                </span>
              )}
            </div>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-[#A8A49A]/30" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#A8A49A]/30" />
        )}
      </button>

      {/* Full timeline bar showing all segment types including offline */}
      <div className="px-4 pb-3">
        {Object.entries(byPlatform).map(([platform, segs]) => (
          <div key={platform} className="flex items-center gap-2 mb-1">
            <span className="text-[9px] text-[#A8A49A]/40 w-16 shrink-0 truncate">
              {platform}
            </span>
            <div className="flex-1 h-2.5 bg-white/[0.03] rounded-full relative overflow-hidden">
              {timelineSpan > 0 &&
                segs.map((seg: any, i: number) => {
                  const segStart = new Date(seg.start_time).getTime();
                  const segEnd = new Date(seg.end_time).getTime();
                  const leftPct =
                    ((segStart - firstStart!.getTime()) / timelineSpan) * 100;
                  const widthPct =
                    ((segEnd - segStart) / timelineSpan) * 100;
                  const cfg = getShowType(seg.show_type);
                  const isBreak = BREAK_SHOW_TYPES.has(seg.show_type as any);
                  const isOffline = seg.show_type === "offline";
                  return (
                    <div
                      key={i}
                      className={`absolute top-0 h-full ${cfg.bar}`}
                      style={{
                        left: `${leftPct}%`,
                        width: `${Math.max(widthPct, 0.3)}%`,
                        opacity: isOffline ? 0.15 : isBreak ? 0.4 : 0.7,
                      }}
                      title={`${cfg.label}: ${fmtTime(seg.start_time)} - ${fmtTime(seg.end_time)} (${fmtDuration(seg.duration_minutes)})`}
                    />
                  );
                })}
            </div>
          </div>
        ))}
        {/* Time axis labels */}
        {timelineSpan > 0 && (
          <div className="flex justify-between ml-[72px] mt-0.5">
            <span className="text-[8px] text-[#A8A49A]/25">
              {fmtTime(allSegments[0]?.start_time)}
            </span>
            <span className="text-[8px] text-[#A8A49A]/25">
              {fmtTime(allSegments[allSegments.length - 1]?.end_time)}
            </span>
          </div>
        )}
      </div>

      {/* Expanded: sessions + detailed segment list */}
      {expanded && (
        <div className="border-t border-white/[0.04] p-4 space-y-4">
          {/* Sessions overview */}
          {daySessions.length > 0 && (
            <div className="space-y-3">
              {daySessions.map((session, idx) => {
                const sessionOnline = session.sessionSegments
                  .filter((s: any) => ONLINE_SHOW_TYPES.has(s.show_type as any))
                  .reduce((acc: number, s: any) => acc + (s.duration_minutes || 0), 0);
                const sessionBreak = session.sessionSegments
                  .filter((s: any) => BREAK_SHOW_TYPES.has(s.show_type as any))
                  .reduce((acc: number, s: any) => acc + (s.duration_minutes || 0), 0);
                const sessionOffline = session.sessionSegments
                  .filter((s: any) => s.show_type === "offline")
                  .reduce((acc: number, s: any) => acc + (s.duration_minutes || 0), 0);

                return (
                  <div key={idx} className="bg-white/[0.02] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Play className="w-3 h-3 text-[#C9A84C]" />
                        <span className="text-[10px] font-medium text-white/70">
                          Session {idx + 1}
                        </span>
                        <span className="text-[10px] text-[#A8A49A]/40">
                          {fmtTime(session.sessionStart)} &mdash; {fmtTime(session.sessionEnd)}
                        </span>
                        {session.shiftMatch && (
                          <Badge
                            variant="outline"
                            className="text-[8px] px-1 py-0 bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/20"
                          >
                            Shift matched
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-emerald-400">{fmtDuration(sessionOnline)}</span>
                        {sessionBreak > 0 && (
                          <span className="text-[10px] text-orange-400/60">{fmtDuration(sessionBreak)} break</span>
                        )}
                        {sessionOffline > 0 && (
                          <span className="text-[10px] text-zinc-500/60">{fmtDuration(sessionOffline)} off</span>
                        )}
                      </div>
                    </div>
                    {/* Mini timeline for session */}
                    <div className="h-2 bg-white/[0.03] rounded-full relative overflow-hidden">
                      {(() => {
                        const sStart = new Date(session.sessionStart).getTime();
                        const sEnd = new Date(session.sessionEnd).getTime();
                        const span = sEnd - sStart;
                        if (span <= 0) return null;
                        return session.sessionSegments.map((seg: any, si: number) => {
                          const segS = new Date(seg.start_time).getTime();
                          const segE = new Date(seg.end_time).getTime();
                          const cfg = getShowType(seg.show_type);
                          const isBreak = BREAK_SHOW_TYPES.has(seg.show_type as any);
                          const isOffline = seg.show_type === "offline";
                          return (
                            <div
                              key={si}
                              className={`absolute top-0 h-full ${cfg.bar}`}
                              style={{
                                left: `${((segS - sStart) / span) * 100}%`,
                                width: `${Math.max(((segE - segS) / span) * 100, 0.3)}%`,
                                opacity: isOffline ? 0.15 : isBreak ? 0.4 : 0.7,
                              }}
                            />
                          );
                        });
                      })()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Detailed segment list by platform */}
          {Object.entries(byPlatform).map(([platform, segs]) => (
            <div key={platform}>
              <p className="text-[10px] text-[#A8A49A]/40 uppercase tracking-wider mb-2">
                {platform}
              </p>
              <div className="space-y-1">
                {segs.map((seg: any, i: number) => {
                  const cfg = getShowType(seg.show_type);
                  const Icon =
                    seg.show_type === "offline"
                      ? Moon
                      : BREAK_SHOW_TYPES.has(seg.show_type as any)
                      ? Coffee
                      : cfg.icon;
                  const isOffline = seg.show_type === "offline";
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-2 ${cfg.bg} rounded-lg px-3 py-1.5`}
                      style={{ opacity: isOffline ? 0.5 : 1 }}
                    >
                      <Icon className={`w-3 h-3 ${cfg.color}`} />
                      <span
                        className={`text-[10px] font-medium ${cfg.color} w-20`}
                      >
                        {cfg.label}
                      </span>
                      <span className="text-[10px] text-white/50">
                        {fmtTime(seg.start_time)} &mdash;{" "}
                        {fmtTime(seg.end_time)}
                      </span>
                      <span className="text-[10px] text-white/30 ml-auto">
                        {fmtDuration(seg.duration_minutes)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Summary by show type */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-2 border-t border-white/[0.04]">
            {Object.entries(breakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([type, mins]) => {
                const cfg = getShowType(type);
                return (
                  <div key={type}>
                    <p className="text-[9px] text-[#A8A49A]/30 uppercase">
                      {cfg.label}
                    </p>
                    <p className={`text-xs font-medium ${cfg.color}`}>
                      {fmtDuration(mins)}
                    </p>
                  </div>
                );
              })}
            <div>
              <p className="text-[9px] text-[#A8A49A]/30 uppercase">
                Total Online
              </p>
              <p className="text-xs font-medium text-[#C9A84C]">
                {fmtDuration(totalOnline)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
