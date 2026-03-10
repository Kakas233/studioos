"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useCamAccounts,
  useStudioAccounts,
  useStudioDailyStats,
  useStreamingSessions,
  useStreamSegments,
  useShifts,
  useShiftAnalysis,
} from "@/hooks/use-studio-data";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { subDays, format } from "date-fns";

import LiveStatus from "@/components/streamtime/live-status";
import StreamSummaryCards from "@/components/streamtime/stream-summary-cards";
import StreamTimeChart from "@/components/streamtime/stream-time-chart";
import StreamLog from "@/components/streamtime/stream-log";
import EnhancedSessionBreakdown from "@/components/streamtime/enhanced-session-breakdown";
import FeatureGate from "@/components/shared/feature-gate";
import DataFetchProgress from "@/components/shared/data-fetch-progress";

export default function StreamTimePage() {
  const { account, loading } = useAuth();

  const [selectedModel, setSelectedModel] = useState("all");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [dateFrom, setDateFrom] = useState(
    format(subDays(new Date(), 7), "yyyy-MM-dd")
  );
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: camAccounts = [], isLoading: loadingCam } = useCamAccounts();
  const { data: studioAccounts = [] } = useStudioAccounts();

  const models = useMemo(
    () => studioAccounts.filter((a) => a.role === "model" && a.is_active !== false),
    [studioAccounts]
  );
  const modelIds = useMemo(() => new Set(models.map((m) => m.id)), [models]);

  const studioCamAccounts = useMemo(
    () => camAccounts.filter((ca) => modelIds.has(ca.model_id)),
    [camAccounts, modelIds]
  );
  const studioCamAccountIds = useMemo(
    () => studioCamAccounts.map((ca) => ca.id),
    [studioCamAccounts]
  );
  const studioCamIds = useMemo(() => new Set(studioCamAccountIds), [studioCamAccountIds]);

  const { data: rawSessions = [], isLoading: loadingSessions } =
    useStreamingSessions(studioCamAccountIds);
  const studioSessions = rawSessions;

  const { data: allStats = [], isLoading: loadingStats } =
    useStudioDailyStats(studioCamAccountIds);
  const { data: streamSegments = [], isLoading: loadingSegments } =
    useStreamSegments(studioCamAccountIds, dateFrom, dateTo);
  const { data: shifts = [] } = useShifts();
  const { data: shiftAnalyses = [], isLoading: loadingAnalyses } =
    useShiftAnalysis();

  const platforms = [
    ...new Set(studioCamAccounts.map((ca) => ca.platform)),
  ].sort();

  const camPlatformMap = useMemo(() => {
    const map: Record<string, string> = {};
    studioCamAccounts.forEach((ca) => {
      map[ca.id] = ca.platform;
    });
    return map;
  }, [studioCamAccounts]);

  const filteredStats = useMemo(() => {
    return allStats.filter((stat) => {
      if (!studioCamIds.has(stat.cam_account_id)) return false;
      if (selectedModel !== "all" && stat.model_id !== selectedModel)
        return false;
      if (
        selectedPlatform !== "all" &&
        camPlatformMap[stat.cam_account_id] !== selectedPlatform
      )
        return false;
      if (stat.date && (stat.date < dateFrom || stat.date > dateTo))
        return false;
      return true;
    });
  }, [
    allStats,
    selectedModel,
    selectedPlatform,
    dateFrom,
    dateTo,
    studioCamIds,
    camPlatformMap,
  ]);

  const isLoading = loading || loadingCam || loadingSessions || loadingStats;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  if (!account || !["owner", "admin"].includes(account.role)) {
    return (
      <div className="text-center py-12 text-white/50">
        <p>You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  return (
    <FeatureGate requiredTier="starter">
      <div className="space-y-6">
        <DataFetchProgress />
        {/* Filters */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-end gap-3 sm:gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-white/60">Model</Label>
            <Select value={selectedModel} onValueChange={(v) => v !== null && setSelectedModel(v)}>
              <SelectTrigger className="w-full sm:w-[180px] bg-white/[0.04] border-white/[0.06] text-white text-xs sm:text-sm">
                <span className="truncate">{selectedModel === "all" ? "All Models" : (models.find((m) => m.id === selectedModel)?.first_name || "Select model")}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                {models
                  .filter((m) =>
                    studioCamAccounts.some((ca) => ca.model_id === m.id)
                  )
                  .map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.first_name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-white/60">Platform</Label>
            <Select
              value={selectedPlatform}
              onValueChange={(v) => v !== null && setSelectedPlatform(v)}
            >
              <SelectTrigger className="w-full sm:w-[180px] bg-white/[0.04] border-white/[0.06] text-white text-xs sm:text-sm">
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {platforms.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-white/60">From</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full sm:w-[160px] bg-white/[0.04] border-white/[0.06] text-white text-xs sm:text-sm [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-white/60">To</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full sm:w-[160px] bg-white/[0.04] border-white/[0.06] text-white text-xs sm:text-sm [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#C9A84C]" />
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <StreamSummaryCards stats={filteredStats} />

            {/* Stacked bar chart */}
            <StreamTimeChart stats={filteredStats} />

            {/* Live status */}
            <LiveStatus
              sessions={studioSessions}
              camAccounts={studioCamAccounts}
              models={models}
            />

            {/* Enhanced Session Breakdown with shift correlation & multi-platform timelines */}
            <EnhancedSessionBreakdown
              shiftAnalyses={shiftAnalyses.filter((a) => {
                if (
                  selectedModel !== "all" &&
                  a.model_id !== selectedModel
                )
                  return false;
                if (
                  a.shift_date &&
                  (a.shift_date < dateFrom || a.shift_date > dateTo)
                )
                  return false;
                return true;
              })}
              streamSegments={streamSegments}
              shifts={shifts}
              models={models}
              selectedModel={selectedModel}
              isLoading={loadingSegments || loadingAnalyses}
            />

            {/* Stream Log */}
            <StreamLog
              stats={filteredStats}
              camAccounts={studioCamAccounts}
              models={models}
              allAccounts={studioAccounts}
              shifts={shifts}
              isLoading={loadingStats}
            />
          </>
        )}
      </div>
    </FeatureGate>
  );
}
