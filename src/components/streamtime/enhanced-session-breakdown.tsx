"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Loader2 } from "lucide-react";
import ShiftTimeline from "./shift-timeline";
import SegmentTimeline from "./segment-timeline";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface EnhancedSessionBreakdownProps {
  shiftAnalyses: any[];
  streamSegments: any[];
  shifts: any[];
  models: any[];
  selectedModel: string;
  isLoading: boolean;
}

export default function EnhancedSessionBreakdown({
  shiftAnalyses,
  streamSegments,
  shifts,
  models,
  selectedModel,
  isLoading,
}: EnhancedSessionBreakdownProps) {
  const [activeTab, setActiveTab] = useState("shifts");
  const [showAll, setShowAll] = useState(false);

  const shiftViews = useMemo(() => {
    if (!shiftAnalyses?.length) return [];

    return shiftAnalyses
      .sort((a, b) => (b.shift_date || "").localeCompare(a.shift_date || ""))
      .filter(
        (a) => selectedModel === "all" || a.model_id === selectedModel
      )
      .map((analysis) => {
        const shift = shifts?.find((s: any) => s.id === analysis.shift_id);
        const shiftStart = new Date(analysis.scheduled_start);
        const shiftEnd = new Date(analysis.scheduled_end);
        const windowStart = new Date(
          shiftStart.getTime() - 30 * 60000
        );
        const windowEnd = new Date(shiftEnd.getTime() + 30 * 60000);

        const matchedSegments = (streamSegments || []).filter(
          (seg: any) => {
            if (seg.model_id !== analysis.model_id) return false;
            const segStart = new Date(seg.start_time);
            const segEnd = new Date(seg.end_time);
            return segStart < windowEnd && segEnd > windowStart;
          }
        );

        return { analysis, shift, segments: matchedSegments };
      });
  }, [shiftAnalyses, streamSegments, shifts, selectedModel]);

  // Build date groups INCLUDING all segments (offline, away, etc.)
  const dateGroups = useMemo(() => {
    if (!streamSegments?.length) return [];

    const filtered = streamSegments.filter((seg: any) => {
      if (selectedModel !== "all" && seg.model_id !== selectedModel)
        return false;
      // Include ALL segment types now — offline and away too
      return true;
    });

    const groups: Record<string, any> = {};
    filtered.forEach((seg: any) => {
      const key = `${seg.date}_${seg.model_id}`;
      if (!groups[key])
        groups[key] = {
          date: seg.date,
          model_id: seg.model_id,
          segments: [],
        };
      groups[key].segments.push(seg);
    });

    return Object.values(groups).sort((a: any, b: any) =>
      b.date.localeCompare(a.date)
    );
  }, [streamSegments, selectedModel]);

  // Match shift analyses to date groups for adherence data
  const dateGroupsWithAdherence = useMemo(() => {
    return dateGroups.map((group: any) => {
      const analysis = shiftAnalyses?.find(
        (a: any) =>
          a.model_id === group.model_id && a.shift_date === group.date
      );
      // Find shifts for this day/model to pass to session detection
      const dayShifts = (shifts || []).filter(
        (s: any) =>
          s.model_id === group.model_id &&
          s.start_time?.startsWith(group.date)
      );
      return { ...group, shiftAnalysis: analysis || null, dayShifts };
    });
  }, [dateGroups, shiftAnalyses, shifts]);

  const displayShifts = showAll ? shiftViews : shiftViews.slice(0, 8);
  const displayDates = showAll
    ? dateGroupsWithAdherence
    : dateGroupsWithAdherence.slice(0, 8);

  if (isLoading) {
    return (
      <Card className="bg-[#111111]/80 border-white/[0.04]">
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#C9A84C]" />
        </CardContent>
      </Card>
    );
  }

  const hasShiftData = shiftViews.length > 0;
  const hasSegmentData = dateGroupsWithAdherence.length > 0;

  if (!hasShiftData && !hasSegmentData) {
    return (
      <Card className="bg-[#111111]/80 border-white/[0.04]">
        <CardContent className="p-8 text-center">
          <Activity className="w-8 h-8 text-[#A8A49A]/20 mx-auto mb-3" />
          <p className="text-sm text-[#A8A49A]/30">
            No streaming sessions found
          </p>
          <p className="text-xs text-[#A8A49A]/20 mt-1">
            Run data sync to fetch stream data
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
            Enhanced
          </Badge>
        </div>
        <Tabs value={activeTab} onValueChange={(v) => v !== null && setActiveTab(v)}>
          <TabsList className="bg-white/[0.03] h-7">
            <TabsTrigger
              value="shifts"
              className="text-[10px] px-2 h-5 data-[state=active]:bg-[#C9A84C]/20 data-[state=active]:text-[#C9A84C]"
            >
              Shift View
            </TabsTrigger>
            <TabsTrigger
              value="timeline"
              className="text-[10px] px-2 h-5 data-[state=active]:bg-[#C9A84C]/20 data-[state=active]:text-[#C9A84C]"
            >
              Timeline View
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeTab === "shifts" ? (
        <div className="space-y-2">
          {displayShifts.length === 0 ? (
            <div className="text-center py-8 text-[#A8A49A]/30 text-sm">
              No shift correlations yet. Run &quot;Correlate Shifts&quot; to
              match shifts with stream data.
            </div>
          ) : (
            displayShifts.map(({ analysis, segments }) => (
              <ShiftTimeline
                key={analysis.id}
                analysis={analysis}
                segments={segments}
                models={models}
              />
            ))
          )}
          {shiftViews.length > 8 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="w-full text-[#A8A49A]/40 hover:text-white text-xs"
            >
              {showAll
                ? "Show Less"
                : `Show All ${shiftViews.length} Shifts`}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {displayDates.length === 0 ? (
            <div className="text-center py-8 text-[#A8A49A]/30 text-sm">
              No stream segment data. Run data sync to fetch timeline
              data.
            </div>
          ) : (
            displayDates.map((group: any) => (
              <SegmentTimeline
                key={`${group.date}_${group.model_id}`}
                date={group.date}
                modelId={group.model_id}
                segments={group.segments}
                models={models}
                shifts={group.dayShifts}
                shiftAnalysis={group.shiftAnalysis}
              />
            ))
          )}
          {dateGroupsWithAdherence.length > 8 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="w-full text-[#A8A49A]/40 hover:text-white text-xs"
            >
              {showAll
                ? "Show Less"
                : `Show All ${dateGroupsWithAdherence.length} Days`}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
