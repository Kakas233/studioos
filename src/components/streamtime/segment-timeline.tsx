"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";
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

interface SegmentTimelineProps {
  date: string;
  modelId: string;
  segments: any[];
  models: any[];
}

export default function SegmentTimeline({
  date,
  modelId,
  segments,
  models,
}: SegmentTimelineProps) {
  const [expanded, setExpanded] = useState(false);
  const modelName =
    models?.find((m: any) => m.id === modelId)?.first_name || "Unknown";

  const byPlatform = useMemo(
    () => mergeSegmentsByPlatform(segments),
    [segments]
  );

  const sorted = useMemo(() => {
    const all = Object.values(byPlatform).flat();
    all.sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
    return all;
  }, [byPlatform]);

  const breakdown: Record<string, number> = {};
  let totalOnline = 0;
  let totalBreak = 0;
  sorted.forEach((seg) => {
    const mins = seg.duration_minutes || 0;
    if (!breakdown[seg.show_type]) breakdown[seg.show_type] = 0;
    breakdown[seg.show_type] += mins;
    if (ONLINE_SHOW_TYPES.has(seg.show_type as any)) totalOnline += mins;
    if (BREAK_SHOW_TYPES.has(seg.show_type as any)) totalBreak += mins;
  });

  const firstStart = sorted[0] ? new Date(sorted[0].start_time) : null;
  const lastEnd = sorted[sorted.length - 1]
    ? new Date(sorted[sorted.length - 1].end_time)
    : null;
  const timelineSpan =
    firstStart && lastEnd
      ? lastEnd.getTime() - firstStart.getTime()
      : 0;

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
            </div>
            <div className="flex items-center gap-3 mt-1">
              {firstStart && (
                <span className="text-[10px] text-[#A8A49A]/40">
                  {fmtTime(sorted[0].start_time)} -{" "}
                  {fmtTime(sorted[sorted.length - 1].end_time)}
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
              <span className="text-[10px] text-[#A8A49A]/30">
                {segments.length} segments
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

      {/* Compact bar */}
      <div className="px-4 pb-3">
        {Object.entries(byPlatform).map(([platform, segs]) => (
          <div key={platform} className="flex items-center gap-2 mb-1">
            <span className="text-[9px] text-[#A8A49A]/40 w-16 shrink-0 truncate">
              {platform}
            </span>
            <div className="flex-1 h-2 bg-white/[0.03] rounded-full relative overflow-hidden">
              {timelineSpan > 0 &&
                segs.map((seg: any, i: number) => {
                  const segStart = new Date(seg.start_time).getTime();
                  const segEnd = new Date(seg.end_time).getTime();
                  const leftPct =
                    ((segStart - firstStart!.getTime()) / timelineSpan) *
                    100;
                  const widthPct =
                    ((segEnd - segStart) / timelineSpan) * 100;
                  const cfg = getShowType(seg.show_type);
                  const isBreak = BREAK_SHOW_TYPES.has(
                    seg.show_type as any
                  );
                  return (
                    <div
                      key={i}
                      className={`absolute top-0 h-full ${cfg.bar}`}
                      style={{
                        left: `${leftPct}%`,
                        width: `${Math.max(widthPct, 0.3)}%`,
                        opacity: isBreak ? 0.4 : 0.7,
                      }}
                    />
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* Expanded: detailed segment list */}
      {expanded && (
        <div className="border-t border-white/[0.04] p-4 space-y-3">
          {Object.entries(byPlatform).map(([platform, segs]) => (
            <div key={platform}>
              <p className="text-[10px] text-[#A8A49A]/40 uppercase tracking-wider mb-2">
                {platform}
              </p>
              <div className="space-y-1">
                {segs
                  .filter(
                    (s: any) =>
                      s.show_type !== "offline" &&
                      s.show_type !== "unknown"
                  )
                  .map((seg: any, i: number) => {
                    const cfg = getShowType(seg.show_type);
                    const Icon = cfg.icon;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-2 ${cfg.bg} rounded-lg px-3 py-1.5`}
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
                        {seg.source && (
                          <Badge
                            variant="outline"
                            className={`text-[7px] px-1 py-0 border-white/[0.04] ${
                              seg.source === "mycamgirlnet"
                                ? "bg-blue-500/5 text-blue-300/40"
                                : seg.source === "merged"
                                ? "bg-purple-500/5 text-purple-300/40"
                                : "bg-white/[0.02] text-white/20"
                            }`}
                          >
                            {seg.source === "mycamgirlnet"
                              ? "mcg"
                              : seg.source}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}

          {/* Summary by show type */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-2 border-t border-white/[0.04]">
            {Object.entries(breakdown)
              .filter(
                ([type]) => type !== "offline" && type !== "unknown"
              )
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
