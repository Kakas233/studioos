"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Loader2,
  Search,
  CheckCircle2,
  Timer,
  AlertTriangle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { getShowType, getGranularBreakdown, fmtDuration } from "@/lib/show-types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function StreamLogRow({
  stat,
  camAccounts,
  models,
  allAccounts,
  shifts,
  shiftAnalysis,
  streamSegments,
}: {
  stat: any;
  camAccounts: any[];
  models: any[];
  allAccounts: any[];
  shifts: any[];
  shiftAnalysis?: any;
  streamSegments?: any[];
}) {
  const [expanded, setExpanded] = useState(false);

  const model = models.find((m: any) => m.id === stat.model_id);
  const ca = camAccounts.find((c: any) => c.id === stat.cam_account_id);
  const modelName = model?.first_name || "Unknown";

  const dayShift = shifts.find(
    (s: any) =>
      s.model_id === stat.model_id &&
      s.start_time?.startsWith(stat.date)
  );
  const operatorName =
    dayShift?.operator_name ||
    allAccounts.find((a: any) => a.id === dayShift?.operator_id)
      ?.first_name ||
    "\u2014";

  const onlineMins = stat.total_minutes || 0;
  const breakdown = getGranularBreakdown(stat);
  const totalBar =
    breakdown.reduce((s: number, b: any) => s + b.minutes, 0) || 1;

  // Adherence data
  const adherence = shiftAnalysis?.adherence_percentage;
  const adherenceColor =
    adherence != null
      ? adherence >= 85
        ? "text-emerald-400"
        : adherence >= 60
        ? "text-amber-400"
        : "text-red-400"
      : null;
  const AdherenceIcon =
    adherence != null
      ? adherence >= 85
        ? CheckCircle2
        : adherence >= 60
        ? Timer
        : AlertTriangle
      : null;

  // Mini segment timeline
  const daySegments = useMemo(() => {
    if (!streamSegments?.length) return [];
    return streamSegments
      .filter(
        (seg: any) =>
          seg.model_id === stat.model_id && seg.date === stat.date
      )
      .sort(
        (a: any, b: any) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
  }, [streamSegments, stat.model_id, stat.date]);

  const timelineSpan = useMemo(() => {
    if (daySegments.length < 2) return 0;
    const first = new Date(daySegments[0].start_time).getTime();
    const last = new Date(daySegments[daySegments.length - 1].end_time).getTime();
    return last - first;
  }, [daySegments]);

  return (
    <div className="bg-[#111111] border border-white/[0.04] rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3.5 sm:p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          {/* Adherence icon or clock */}
          {AdherenceIcon ? (
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
                adherence! >= 85
                  ? "bg-emerald-500/10 border-emerald-500/20"
                  : adherence! >= 60
                  ? "bg-amber-500/10 border-amber-500/20"
                  : "bg-red-500/10 border-red-500/20"
              }`}
            >
              <AdherenceIcon
                className={`w-4 h-4 ${adherenceColor}`}
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 text-[#C9A84C]" />
            </div>
          )}
          <div className="text-left min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-medium text-white">
                {modelName}
              </p>
              <span className="text-[#A8A49A]/20">&middot;</span>
              <p className="text-xs text-[#A8A49A]/50">
                {format(parseISO(stat.date), "EEE, MMM d")}
              </p>
              {ca && (
                <Badge
                  variant="outline"
                  className="text-[9px] px-1.5 py-0 bg-white/[0.03] text-white/40 border-white/[0.06]"
                >
                  {ca.platform}
                </Badge>
              )}
              {adherence != null && (
                <Badge
                  variant="outline"
                  className={`text-[9px] px-1.5 py-0 ${
                    adherence >= 85
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : adherence >= 60
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}
                >
                  {adherence}% adherence
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-[#C9A84C] font-semibold">
                {fmtDuration(onlineMins)} online
              </span>
              {shiftAnalysis && (
                <>
                  {shiftAnalysis.late_start_minutes > 2 && (
                    <span className="text-[10px] text-red-400/60">
                      {shiftAnalysis.late_start_minutes}m late
                    </span>
                  )}
                  {shiftAnalysis.early_end_minutes > 5 && (
                    <span className="text-[10px] text-amber-400/60">
                      {shiftAnalysis.early_end_minutes}m early
                    </span>
                  )}
                  {shiftAnalysis.total_break_minutes > 0 && (
                    <span className="text-[10px] text-orange-400/50">
                      {fmtDuration(shiftAnalysis.total_break_minutes)} break
                    </span>
                  )}
                </>
              )}
              {operatorName !== "\u2014" && (
                <span className="text-[10px] text-[#A8A49A]/35">
                  Op: {operatorName}
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Mini bar */}
        <div className="hidden sm:flex items-center gap-3 shrink-0 mr-3">
          <div className="w-32 h-2 bg-white/[0.03] rounded-full overflow-hidden flex">
            {breakdown.map((b: any, i: number) => (
              <div
                key={i}
                className={`${b.config?.bar || b.bar} h-full`}
                style={{
                  width: `${(b.minutes / totalBar) * 100}%`,
                  opacity:
                    (b.type || b.showType) === "away" ||
                    (b.type || b.showType) === "on_break"
                      ? 0.4
                      : 0.8,
                }}
              />
            ))}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-[#A8A49A]/30 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#A8A49A]/30 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-white/[0.04] p-4 space-y-3">
          {/* Segment timeline if available */}
          {daySegments.length > 0 && timelineSpan > 0 && (
            <div>
              <p className="text-[9px] text-[#A8A49A]/30 uppercase mb-1.5">
                Session Timeline
              </p>
              <div className="h-4 bg-white/[0.03] rounded-lg relative overflow-hidden">
                {(() => {
                  const spanStart = new Date(daySegments[0].start_time).getTime();
                  return daySegments.map((seg: any, i: number) => {
                    const segS = new Date(seg.start_time).getTime();
                    const segE = new Date(seg.end_time).getTime();
                    const cfg = getShowType(seg.show_type);
                    const isBreak =
                      seg.show_type === "away" || seg.show_type === "on_break";
                    const isOffline = seg.show_type === "offline";
                    const leftPct = ((segS - spanStart) / timelineSpan) * 100;
                    const widthPct = ((segE - segS) / timelineSpan) * 100;
                    return (
                      <div
                        key={i}
                        className={`absolute top-0 h-full ${cfg.bar}`}
                        style={{
                          left: `${leftPct}%`,
                          width: `${Math.max(widthPct, 0.3)}%`,
                          opacity: isOffline ? 0.15 : isBreak ? 0.4 : 0.8,
                        }}
                        title={`${cfg.label}: ${fmtDuration(seg.duration_minutes || 0)}`}
                      />
                    );
                  });
                })()}
              </div>
              <div className="flex justify-between mt-0.5">
                <span className="text-[8px] text-[#A8A49A]/25">
                  {format(parseISO(daySegments[0].start_time), "HH:mm")}
                </span>
                <span className="text-[8px] text-[#A8A49A]/25">
                  {format(
                    parseISO(daySegments[daySegments.length - 1].end_time),
                    "HH:mm"
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Show type breakdown - granular */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {breakdown.map((b: any) => {
              const Icon = b.config?.icon || b.icon;
              const color = b.config?.color || b.color;
              const bg = b.config?.bg || b.bg;
              const label = b.config?.label || b.label;
              return (
                <div
                  key={b.type || b.showType}
                  className={`${bg} rounded-lg px-3 py-2 flex items-center gap-2`}
                >
                  {Icon && <Icon className={`w-3.5 h-3.5 ${color}`} />}
                  <div>
                    <p className={`text-xs font-medium ${color}`}>
                      {fmtDuration(b.minutes)}
                    </p>
                    <p className="text-[9px] text-[#A8A49A]/30">
                      {label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Details row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/[0.04]">
            <div>
              <p className="text-[9px] text-[#A8A49A]/30 uppercase">
                Model
              </p>
              <p className="text-xs text-white font-medium">
                {modelName}
              </p>
            </div>
            <div>
              <p className="text-[9px] text-[#A8A49A]/30 uppercase">
                Operator
              </p>
              <p className="text-xs text-white font-medium">
                {operatorName}
              </p>
            </div>
            <div>
              <p className="text-[9px] text-[#A8A49A]/30 uppercase">
                Platform
              </p>
              <p className="text-xs text-white font-medium">
                {ca?.platform || "\u2014"}
              </p>
            </div>
            <div>
              <p className="text-[9px] text-[#A8A49A]/30 uppercase">
                Total Online
              </p>
              <p className="text-xs text-[#C9A84C] font-semibold">
                {fmtDuration(onlineMins)}
              </p>
            </div>
          </div>

          {/* Shift adherence details if available */}
          {shiftAnalysis && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-white/[0.04]">
              <div>
                <p className="text-[9px] text-[#A8A49A]/30 uppercase">
                  Scheduled
                </p>
                <p className="text-xs text-white font-medium">
                  {shiftAnalysis.scheduled_start
                    ? format(parseISO(shiftAnalysis.scheduled_start), "HH:mm")
                    : "\u2014"}{" "}
                  -{" "}
                  {shiftAnalysis.scheduled_end
                    ? format(parseISO(shiftAnalysis.scheduled_end), "HH:mm")
                    : "\u2014"}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-[#A8A49A]/30 uppercase">
                  Actual
                </p>
                <p className="text-xs text-white font-medium">
                  {shiftAnalysis.actual_start
                    ? format(parseISO(shiftAnalysis.actual_start), "HH:mm")
                    : "No data"}{" "}
                  -{" "}
                  {shiftAnalysis.actual_end
                    ? format(parseISO(shiftAnalysis.actual_end), "HH:mm")
                    : "No data"}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-[#A8A49A]/30 uppercase">
                  Adherence
                </p>
                <p className={`text-xs font-semibold ${adherenceColor}`}>
                  {adherence}%
                </p>
              </div>
              <div>
                <p className="text-[9px] text-[#A8A49A]/30 uppercase">
                  Segments
                </p>
                <p className="text-xs text-white">
                  {shiftAnalysis.segment_count || 0} activity changes
                </p>
              </div>
            </div>
          )}

          {/* Full bar */}
          <div>
            <p className="text-[9px] text-[#A8A49A]/30 uppercase mb-1.5">
              Time Distribution
            </p>
            <div className="w-full h-4 bg-white/[0.03] rounded-lg overflow-hidden flex">
              {breakdown.map((b: any, i: number) => {
                const showType = b.type || b.showType;
                const isBreak =
                  showType === "away" || showType === "on_break";
                return (
                  <div
                    key={i}
                    className={`${b.config?.bar || b.bar} h-full relative`}
                    style={{
                      width: `${(b.minutes / totalBar) * 100}%`,
                      opacity: isBreak ? 0.4 : 0.8,
                    }}
                  >
                    {b.minutes / totalBar > 0.12 && (
                      <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-medium">
                        {fmtDuration(b.minutes)}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {breakdown.map((b: any) => {
                const showType = b.type || b.showType;
                return (
                  <div
                    key={showType}
                    className="flex items-center gap-1"
                  >
                    <div
                      className={`w-2 h-2 rounded-sm ${b.config?.bar || b.bar}`}
                      style={{
                        opacity:
                          showType === "away" ||
                          showType === "on_break"
                            ? 0.4
                            : 0.8,
                      }}
                    />
                    <span className="text-[9px] text-[#A8A49A]/40">
                      {b.config?.label || b.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface StreamLogProps {
  stats: any[];
  camAccounts: any[];
  models: any[];
  allAccounts: any[];
  shifts: any[];
  shiftAnalyses?: any[];
  streamSegments?: any[];
  isLoading: boolean;
}

export default function StreamLog({
  stats,
  camAccounts,
  models,
  allAccounts,
  shifts,
  shiftAnalyses,
  streamSegments,
  isLoading,
}: StreamLogProps) {
  const [showCount, setShowCount] = useState(15);
  const [searchQuery, setSearchQuery] = useState("");

  const sorted = useMemo(() => {
    let filtered = [...stats];

    // Search by model name, date, or platform
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((stat) => {
        const model = models.find((m: any) => m.id === stat.model_id);
        const modelName = model?.first_name?.toLowerCase() || "";
        const ca = camAccounts.find((c: any) => c.id === stat.cam_account_id);
        const platform = ca?.platform?.toLowerCase() || "";
        const dateStr = stat.date || "";
        // Also search formatted date
        let formattedDate = "";
        try {
          formattedDate = format(parseISO(stat.date), "EEE MMM d yyyy").toLowerCase();
        } catch { /* ignore */ }

        return (
          modelName.includes(q) ||
          platform.includes(q) ||
          dateStr.includes(q) ||
          formattedDate.includes(q)
        );
      });
    }

    return filtered.sort((a, b) => {
      const dateCompare = (b.date || "").localeCompare(a.date || "");
      if (dateCompare !== 0) return dateCompare;
      const aModel =
        models.find((m: any) => m.id === a.model_id)?.first_name || "";
      const bModel =
        models.find((m: any) => m.id === b.model_id)?.first_name || "";
      return aModel.localeCompare(bModel);
    });
  }, [stats, models, camAccounts, searchQuery]);

  const displayed = sorted.slice(0, showCount);

  // Build a lookup map for shift analyses by model_id + date
  const analysisMap = useMemo(() => {
    const map: Record<string, any> = {};
    (shiftAnalyses || []).forEach((a: any) => {
      const key = `${a.model_id}_${a.shift_date}`;
      map[key] = a;
    });
    return map;
  }, [shiftAnalyses]);

  // Stats summary
  const totalEntries = sorted.length;
  const withAdherence = sorted.filter((s) => {
    const key = `${s.model_id}_${s.date}`;
    return analysisMap[key] != null;
  }).length;

  return (
    <Card className="bg-[#111111]/80 border-white/[0.04]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#C9A84C]" />
            Stream Log
            {totalEntries > 0 && (
              <Badge className="bg-white/[0.06] text-[#A8A49A]/60 text-[10px] border-0 ml-1">
                {totalEntries} entries
              </Badge>
            )}
            {withAdherence > 0 && (
              <Badge className="bg-emerald-500/10 text-emerald-400/60 text-[10px] border-0">
                {withAdherence} with adherence
              </Badge>
            )}
          </CardTitle>
          {/* Search input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A8A49A]/30" />
            <Input
              placeholder="Search model, date, platform..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowCount(15); // Reset pagination on search
              }}
              className="pl-8 h-8 bg-white/[0.04] border-white/[0.06] text-white text-xs placeholder:text-[#A8A49A]/25"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-[#C9A84C]" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-10">
            <FileText className="w-8 h-8 mx-auto mb-3 text-[#A8A49A]/15" />
            <p className="text-sm text-[#A8A49A]/30">
              {searchQuery
                ? "No results match your search"
                : "No streaming data for this period"}
            </p>
            <p className="text-xs text-[#A8A49A]/20 mt-1">
              {searchQuery
                ? "Try a different search term"
                : "Stats will appear as stream data is collected"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map((stat: any) => {
              const key = `${stat.model_id}_${stat.date}`;
              return (
                <StreamLogRow
                  key={stat.id}
                  stat={stat}
                  camAccounts={camAccounts}
                  models={models}
                  allAccounts={allAccounts}
                  shifts={shifts}
                  shiftAnalysis={analysisMap[key]}
                  streamSegments={streamSegments}
                />
              );
            })}
            {sorted.length > showCount && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCount((prev) => prev + 20)}
                className="w-full text-[#A8A49A]/40 hover:text-white text-xs"
              >
                Show More ({sorted.length - showCount} remaining)
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
