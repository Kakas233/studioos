"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useEarnings,
  useCamAccounts,
  useStudioAccounts,
  useStudioDailyStats,
} from "@/hooks/use-studio-data";
import {
  subDays,
  format,
  getDay,
} from "date-fns";
import { Loader2, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";
import {
  WidgetWrapper,
  WidgetSelector,
} from "@/components/shared/widget-container";

import InsightsFilters from "@/components/modelinsights/insights-filters";
import InsightsStatTiles from "@/components/modelinsights/insights-stat-tiles";
import RevenueAreaChart from "@/components/modelinsights/revenue-area-chart";
import StreamHeatmap from "@/components/modelinsights/stream-heatmap";
import ShowTypeBreakdown from "@/components/modelinsights/show-type-breakdown";
import SiteBreakdown from "@/components/modelinsights/site-breakdown";
import BestTimesChart from "@/components/modelinsights/best-times-chart";
import Recommendations from "@/components/modelinsights/recommendations";
import RevenueScatterPlot from "@/components/modelinsights/revenue-scatter-plot";
import EarningsPerHourChart from "@/components/modelinsights/earnings-per-hour-chart";
import FeatureGate from "@/components/shared/feature-gate";
import DataFetchProgress from "@/components/shared/data-fetch-progress";

/* eslint-disable @typescript-eslint/no-explicit-any */

const ALL_WIDGETS = [
  { id: "stats", label: "Stat Tiles", col: "full" },
  { id: "revenue", label: "Revenue Chart", col: "full" },
  { id: "showType", label: "Show Type Breakdown", col: "half" },
  { id: "siteBreakdown", label: "Site Breakdown", col: "half" },
  { id: "scatter", label: "Hours vs Revenue", col: "half" },
  { id: "efficiency", label: "Earnings Efficiency", col: "half" },
  { id: "heatmapAll", label: "Stream Heatmap", col: "full" },
  { id: "heatmapPvt", label: "Private Heatmap", col: "half" },
  { id: "heatmapPub", label: "Public Heatmap", col: "half" },
  { id: "bestTimes", label: "Best Hours", col: "full" },
  { id: "recommendations", label: "Recommendations", col: "full" },
];

const DEFAULT_WIDGETS = [
  "stats",
  "revenue",
  "showType",
  "siteBreakdown",
  "heatmapAll",
  "heatmapPvt",
  "heatmapPub",
  "bestTimes",
  "recommendations",
];
const STORAGE_KEY = "insights_widgets";

export default function ModelInsightsPage() {
  const { account, loading: authLoading } = useAuth();

  const [selectedModel, setSelectedModel] = useState("all");
  const [selectedPlatform, setSelectedPlatform] = useState("all");
  const [dateRange, setDateRange] = useState({
    start: subDays(new Date(), 29),
    end: new Date(),
  });
  const [showCustomizer, setShowCustomizer] = useState(false);

  const [activeWidgets, setActiveWidgets] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_WIDGETS;
    } catch {
      return DEFAULT_WIDGETS;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activeWidgets));
  }, [activeWidgets]);

  const toggleWidget = (id: string) => {
    setActiveWidgets((prev) =>
      prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
    );
  };

  const removeWidget = (id: string) => {
    setActiveWidgets((prev) => prev.filter((w) => w !== id));
  };

  const { data: earnings = [] } = useEarnings();
  const { data: camAccounts = [] } = useCamAccounts();
  const { data: studioAccounts = [] } = useStudioAccounts();

  const models = useMemo(
    () => studioAccounts.filter((a: any) => a.role === "model" && a.is_active !== false),
    [studioAccounts]
  );
  const modelIds = useMemo(
    () => new Set(models.map((m: any) => m.id)),
    [models]
  );
  const studioCamAccounts = useMemo(
    () => camAccounts.filter((ca: any) => modelIds.has(ca.model_id)),
    [camAccounts, modelIds]
  );
  const studioCamAccountIds = useMemo(
    () => studioCamAccounts.map((ca: any) => ca.id),
    [studioCamAccounts]
  );
  const { data: allStats = [] } = useStudioDailyStats(studioCamAccountIds);

  const platforms = [
    ...new Set(studioCamAccounts.map((ca: any) => ca.platform)),
  ].sort() as string[];

  const camPlatformMap = useMemo(() => {
    const map: Record<string, string> = {};
    studioCamAccounts.forEach((ca: any) => {
      map[ca.id] = ca.platform;
    });
    return map;
  }, [studioCamAccounts]);

  const dateFromStr = format(dateRange.start, "yyyy-MM-dd");
  const dateToStr = format(dateRange.end, "yyyy-MM-dd");

  const filteredEarnings = useMemo(() => {
    return earnings.filter((e: any) => {
      if (!e.shift_date) return false;
      if (e.shift_date < dateFromStr || e.shift_date > dateToStr) return false;
      if (selectedModel !== "all" && e.model_id !== selectedModel)
        return false;
      return true;
    });
  }, [earnings, dateFromStr, dateToStr, selectedModel]);

  const allTimeEarnings = useMemo(() => {
    return earnings.filter(
      (e: any) =>
        selectedModel === "all" || e.model_id === selectedModel
    );
  }, [earnings, selectedModel]);

  const studioCamIdSet = useMemo(
    () => new Set(studioCamAccountIds),
    [studioCamAccountIds]
  );
  const filteredStats = useMemo(() => {
    return allStats.filter((stat: any) => {
      if (!studioCamIdSet.has(stat.cam_account_id)) return false;
      if (selectedModel !== "all" && stat.model_id !== selectedModel)
        return false;
      if (
        selectedPlatform !== "all" &&
        camPlatformMap[stat.cam_account_id] !== selectedPlatform
      )
        return false;
      if (!stat.date) return false;
      if (stat.date < dateFromStr || stat.date > dateToStr) return false;
      return true;
    });
  }, [
    allStats,
    selectedModel,
    selectedPlatform,
    dateFromStr,
    dateToStr,
    camPlatformMap,
    studioCamIdSet,
  ]);

  const heatmaps = useMemo(() => {
    const streaming: Record<number, Record<number, number>> = {};
    const pvtMap: Record<number, Record<number, number>> = {};
    const publicMap: Record<number, Record<number, number>> = {};
    filteredStats.forEach((stat: any) => {
      if (!stat.date) return;
      const d = new Date(stat.date + "T12:00:00");
      let dow = getDay(d) - 1;
      if (dow < 0) dow = 6;
      if (!streaming[dow]) streaming[dow] = {};
      if (!pvtMap[dow]) pvtMap[dow] = {};
      if (!publicMap[dow]) publicMap[dow] = {};
      const weights = [
        0.3, 0.2, 0.1, 0.1, 0.1, 0.1, 0.2, 0.4, 0.7, 1.0, 1.2,
        1.4, 1.5, 1.6, 1.8, 2.0, 2.2, 2.5, 2.8, 3.0, 3.2, 2.8,
        2.0, 1.0,
      ];
      const totalW = weights.reduce((a, b) => a + b, 0);
      for (let h = 0; h < 24; h++) {
        const w = weights[h] / totalW;
        streaming[dow][h] =
          (streaming[dow][h] || 0) +
          (stat.total_minutes || 0) * w;
        const pvtMins =
          (stat.private_chat_minutes || 0) +
          (stat.nude_chat_minutes || 0) +
          (stat.semiprivate_minutes || 0) +
          (stat.vip_chat_minutes || 0) +
          (stat.true_private_minutes || 0) +
          (stat.paid_chat_minutes || 0);
        pvtMap[dow][h] = (pvtMap[dow][h] || 0) + pvtMins * w;
        publicMap[dow][h] =
          (publicMap[dow][h] || 0) +
          (stat.free_chat_minutes || 0) * w;
      }
    });
    return { streaming, pvtMap, publicMap };
  }, [filteredStats]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" />
      </div>
    );
  }

  if (!account || !["owner", "admin"].includes(account.role)) {
    return (
      <div className="text-center py-12 text-[#A8A49A]/40 text-sm">
        Access restricted to admin roles.
      </div>
    );
  }

  const widgetMap: Record<string, React.ReactNode> = {
    stats: (
      <InsightsStatTiles
        earnings={filteredEarnings}
        streamStats={filteredStats}
        allEarnings={allTimeEarnings}
      />
    ),
    revenue: (
      <RevenueAreaChart
        earnings={filteredEarnings}
        dateRange={dateRange}
      />
    ),
    showType: <ShowTypeBreakdown streamStats={filteredStats} />,
    siteBreakdown: <SiteBreakdown earnings={filteredEarnings} />,
    scatter: (
      <RevenueScatterPlot
        earnings={filteredEarnings}
        streamStats={filteredStats}
      />
    ),
    efficiency: (
      <EarningsPerHourChart
        earnings={filteredEarnings}
        streamStats={filteredStats}
        dateRange={dateRange}
      />
    ),
    heatmapAll: (
      <StreamHeatmap
        title="Streaming Activity Heatmap"
        data={heatmaps.streaming}
        hue="gold"
      />
    ),
    heatmapPvt: (
      <StreamHeatmap
        title="Private Show Heatmap"
        data={heatmaps.pvtMap}
        hue="pink"
      />
    ),
    heatmapPub: (
      <StreamHeatmap
        title="Public Show Heatmap"
        data={heatmaps.publicMap}
        hue="green"
      />
    ),
    bestTimes: <BestTimesChart streamStats={filteredStats} />,
    recommendations: (
      <Recommendations
        earnings={filteredEarnings}
        streamStats={filteredStats}
        selectedModel={selectedModel}
      />
    ),
  };

  // Render widgets in layout order
  const orderedWidgets = ALL_WIDGETS.filter((w) =>
    activeWidgets.includes(w.id)
  );

  // Group active widgets into rows: full-width = own row, half-width = pairs
  const rows: { type: string; items: typeof ALL_WIDGETS }[] = [];
  let halfBuffer: typeof ALL_WIDGETS = [];

  orderedWidgets.forEach((w) => {
    if (w.col === "full") {
      if (halfBuffer.length > 0) {
        rows.push({ type: "half", items: [...halfBuffer] });
        halfBuffer = [];
      }
      rows.push({ type: "full", items: [w] });
    } else {
      halfBuffer.push(w);
      if (halfBuffer.length === 2) {
        rows.push({ type: "half", items: [...halfBuffer] });
        halfBuffer = [];
      }
    }
  });
  if (halfBuffer.length > 0)
    rows.push({ type: "half", items: [...halfBuffer] });

  return (
    <FeatureGate requiredTier="starter">
      <div className="space-y-4 sm:space-y-5 max-w-[1400px] mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          <div className="flex-1 w-full">
            <InsightsFilters
              models={models}
              platforms={platforms}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              selectedPlatform={selectedPlatform}
              setSelectedPlatform={setSelectedPlatform}
              dateRange={dateRange}
              setDateRange={setDateRange}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomizer(!showCustomizer)}
            className="h-9 border-white/[0.06] bg-white/[0.03] text-[#A8A49A]/50 hover:text-white hover:bg-white/[0.06] shrink-0"
          >
            <LayoutGrid className="w-3.5 h-3.5 mr-1.5" />
            Customize
          </Button>
        </div>

        <DataFetchProgress />

        <AnimatePresence>
          <WidgetSelector
            allWidgets={ALL_WIDGETS}
            activeIds={activeWidgets}
            onToggle={toggleWidget}
            isOpen={showCustomizer}
            onClose={() => setShowCustomizer(false)}
          />
        </AnimatePresence>

        {rows.map((row, ri) => {
          if (row.type === "full") {
            const w = row.items[0];
            return (
              <WidgetWrapper
                key={w.id}
                id={w.id}
                title={w.label}
                onRemove={removeWidget}
              >
                {widgetMap[w.id]}
              </WidgetWrapper>
            );
          }
          return (
            <div
              key={`row-${ri}`}
              className="grid grid-cols-1 lg:grid-cols-2 gap-5"
            >
              {row.items.map((w) => (
                <WidgetWrapper
                  key={w.id}
                  id={w.id}
                  title={w.label}
                  onRemove={removeWidget}
                >
                  {widgetMap[w.id]}
                </WidgetWrapper>
              ))}
            </div>
          );
        })}
      </div>
    </FeatureGate>
  );
}
