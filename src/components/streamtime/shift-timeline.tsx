"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle2,
  Timer,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { mergeSegments } from "./merge-segments";
import { getShowType, fmtDuration, BREAK_SHOW_TYPES } from "@/lib/show-types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function fmtTime(isoStr: string | undefined | null): string {
  if (!isoStr) return "--:--";
  return format(parseISO(isoStr), "HH:mm");
}

function PlatformTimelineBar({
  segments,
  shiftStart,
  shiftEnd,
  platform,
}: {
  segments: any[];
  shiftStart: Date;
  shiftEnd: Date;
  platform: string;
}) {
  if (!segments || segments.length === 0) return null;
  const startMs = shiftStart.getTime();
  const endMs = shiftEnd.getTime();
  const totalMs = endMs - startMs;
  if (totalMs <= 0) return null;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-[#A8A49A]/50 w-20 shrink-0 truncate">
          {platform}
        </span>
        <div className="flex-1 h-5 bg-white/[0.03] rounded relative overflow-hidden">
          {segments.map((seg: any, i: number) => {
            const segStart = new Date(seg.start_time).getTime();
            const segEnd = new Date(seg.end_time).getTime();
            const clipStart = Math.max(segStart, startMs);
            const clipEnd = Math.min(segEnd, endMs);
            if (clipStart >= clipEnd) return null;
            const leftPct = ((clipStart - startMs) / totalMs) * 100;
            const widthPct = ((clipEnd - clipStart) / totalMs) * 100;
            const cfg = getShowType(seg.show_type);
            const isBreak = BREAK_SHOW_TYPES.has(seg.show_type as any);
            return (
              <div
                key={i}
                className={`absolute top-0 h-full ${cfg.bar} transition-all`}
                style={{
                  left: `${leftPct}%`,
                  width: `${Math.max(widthPct, 0.3)}%`,
                  opacity: isBreak
                    ? 0.5
                    : seg.show_type === "offline"
                    ? 0.2
                    : 0.8,
                }}
                title={`${cfg.label}: ${fmtTime(seg.start_time)} - ${fmtTime(seg.end_time)} (${fmtDuration(seg.duration_minutes)})`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TimeAxis({
  shiftStart,
  shiftEnd,
}: {
  shiftStart: Date;
  shiftEnd: Date;
}) {
  const startMs = shiftStart.getTime();
  const endMs = shiftEnd.getTime();
  const totalMs = endMs - startMs;
  const hours = Math.ceil(totalMs / 3600000);
  const ticks: { pct: number; label: string }[] = [];
  for (let i = 0; i <= hours; i++) {
    const tickTime = new Date(startMs + i * 3600000);
    if (tickTime > shiftEnd) break;
    const pct = ((tickTime.getTime() - startMs) / totalMs) * 100;
    ticks.push({ pct, label: format(tickTime, "HH:mm") });
  }
  return (
    <div className="relative h-4 ml-[88px]">
      {ticks.map((tick, i) => (
        <span
          key={i}
          className="absolute text-[8px] text-[#A8A49A]/30 -translate-x-1/2"
          style={{ left: `${tick.pct}%` }}
        >
          {tick.label}
        </span>
      ))}
    </div>
  );
}

interface ShiftTimelineProps {
  analysis: any;
  segments: any[];
  models: any[];
}

export default function ShiftTimeline({
  analysis,
  segments,
  models,
}: ShiftTimelineProps) {
  const [expanded, setExpanded] = useState(false);
  const modelName =
    models?.find((m: any) => m.id === analysis.model_id)?.first_name ||
    analysis.model_name ||
    "Unknown";
  const shiftStart = new Date(analysis.scheduled_start);
  const shiftEnd = new Date(analysis.scheduled_end);
  const scheduledMins =
    (shiftEnd.getTime() - shiftStart.getTime()) / 60000;

  const mergedSegments = useMemo(
    () => mergeSegments(segments || []),
    [segments]
  );

  const segsByPlatform: Record<string, any[]> = {};
  mergedSegments.forEach((seg) => {
    const p = seg.platform || "Unknown";
    if (!segsByPlatform[p]) segsByPlatform[p] = [];
    segsByPlatform[p].push(seg);
  });

  const showTypeBreakdown: Record<string, number> = {};
  mergedSegments.forEach((seg) => {
    if (seg.show_type === "offline" || seg.show_type === "unknown") return;
    if (!showTypeBreakdown[seg.show_type])
      showTypeBreakdown[seg.show_type] = 0;
    showTypeBreakdown[seg.show_type] += seg.duration_minutes || 0;
  });

  const adherence = analysis.adherence_percentage || 0;
  const adherenceColor =
    adherence >= 85
      ? "text-emerald-400"
      : adherence >= 60
      ? "text-amber-400"
      : "text-red-400";
  const adherenceBg =
    adherence >= 85
      ? "bg-emerald-500/10 border-emerald-500/20"
      : adherence >= 60
      ? "bg-amber-500/10 border-amber-500/20"
      : "bg-red-500/10 border-red-500/20";

  return (
    <div className="bg-[#111111] border border-white/[0.04] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${adherenceBg}`}
          >
            {adherence >= 85 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : adherence >= 60 ? (
              <Timer className="w-5 h-5 text-amber-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400" />
            )}
          </div>
          <div className="text-left min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-white">{modelName}</p>
              <span className="text-xs text-[#A8A49A]/30">&bull;</span>
              <p className="text-xs text-[#A8A49A]/50">
                {format(parseISO(analysis.shift_date), "MMM d")} &middot;{" "}
                {fmtTime(analysis.scheduled_start)} -{" "}
                {fmtTime(analysis.scheduled_end)}
              </p>
              {analysis.platforms_used?.length > 0 && (
                <div className="flex gap-1">
                  {analysis.platforms_used.map((p: string) => (
                    <Badge
                      key={p}
                      variant="outline"
                      className="text-[8px] px-1 py-0 bg-white/[0.03] text-white/40 border-white/[0.06]"
                    >
                      {p}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-xs font-semibold ${adherenceColor}`}>
                {adherence}% adherence
              </span>
              <span className="text-xs text-emerald-400/70">
                {fmtDuration(analysis.total_online_minutes)} online
              </span>
              {analysis.late_start_minutes > 2 && (
                <span className="text-xs text-red-400/60">
                  {analysis.late_start_minutes}m late
                </span>
              )}
              {analysis.early_end_minutes > 5 && (
                <span className="text-xs text-amber-400/60">
                  {analysis.early_end_minutes}m early
                </span>
              )}
              {analysis.total_break_minutes > 0 && (
                <span className="text-xs text-orange-400/40">
                  {fmtDuration(analysis.total_break_minutes)} break
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

      {/* Compact timeline bar */}
      <div className="px-4 pb-3">
        <div className="h-2 rounded-full bg-white/[0.03] flex overflow-hidden">
          {Object.entries(showTypeBreakdown)
            .sort((a, b) => b[1] - a[1])
            .map(([type, mins]) => {
              const cfg = getShowType(type);
              const isBreak = BREAK_SHOW_TYPES.has(type as any);
              return (
                <div
                  key={type}
                  className={`${cfg.bar} h-full`}
                  style={{
                    width: `${(mins / scheduledMins) * 100}%`,
                    opacity: isBreak ? 0.4 : 0.8,
                  }}
                />
              );
            })}
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-white/[0.04] p-4 space-y-3">
          <TimeAxis shiftStart={shiftStart} shiftEnd={shiftEnd} />
          {Object.entries(segsByPlatform).map(([platform, segs]) => (
            <PlatformTimelineBar
              key={platform}
              segments={segs}
              shiftStart={shiftStart}
              shiftEnd={shiftEnd}
              platform={platform}
            />
          ))}

          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-[#A8A49A]/50 w-20 shrink-0">
              Scheduled
            </span>
            <div className="flex-1 h-3 bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded relative">
              <span className="absolute left-1 top-0 text-[8px] text-[#C9A84C]/50 leading-3">
                {fmtTime(analysis.scheduled_start)}
              </span>
              <span className="absolute right-1 top-0 text-[8px] text-[#C9A84C]/50 leading-3">
                {fmtTime(analysis.scheduled_end)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/[0.04]">
            <div>
              <p className="text-[9px] text-[#A8A49A]/30 uppercase">
                Actual Start
              </p>
              <p className="text-xs text-white font-medium">
                {analysis.actual_start
                  ? fmtTime(analysis.actual_start)
                  : "No data"}
              </p>
            </div>
            <div>
              <p className="text-[9px] text-[#A8A49A]/30 uppercase">
                Actual End
              </p>
              <p className="text-xs text-white font-medium">
                {analysis.actual_end
                  ? fmtTime(analysis.actual_end)
                  : "No data"}
              </p>
            </div>
            <div>
              <p className="text-[9px] text-[#A8A49A]/30 uppercase">
                Online / Break
              </p>
              <p className="text-xs">
                <span className="text-emerald-400">
                  {fmtDuration(analysis.total_online_minutes)}
                </span>{" "}
                <span className="text-[#A8A49A]/20">/</span>{" "}
                <span className="text-orange-400">
                  {fmtDuration(analysis.total_break_minutes)}
                </span>
              </p>
            </div>
            <div>
              <p className="text-[9px] text-[#A8A49A]/30 uppercase">
                Segments
              </p>
              <p className="text-xs text-white">
                {analysis.segment_count || 0} activity changes
              </p>
            </div>
          </div>

          {/* Legend from actual show types present */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-white/[0.04]">
            {Object.keys(showTypeBreakdown).map((type) => {
              const cfg = getShowType(type);
              const isBreak = BREAK_SHOW_TYPES.has(type as any);
              return (
                <div key={type} className="flex items-center gap-1">
                  <div
                    className={`w-2 h-2 rounded-sm ${cfg.bar}`}
                    style={{ opacity: isBreak ? 0.5 : 0.8 }}
                  />
                  <span className="text-[9px] text-[#A8A49A]/40">
                    {cfg.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
