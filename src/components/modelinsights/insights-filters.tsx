"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarDays } from "lucide-react";
import {
  format,
  subDays,
  subMonths,
  startOfMonth,
  endOfMonth,
} from "date-fns";

/* eslint-disable @typescript-eslint/no-explicit-any */

const PRESETS = [
  {
    label: "7d",
    fn: () => ({ start: subDays(new Date(), 6), end: new Date() }),
  },
  {
    label: "30d",
    fn: () => ({ start: subDays(new Date(), 29), end: new Date() }),
  },
  {
    label: "This Month",
    fn: () => ({
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date()),
    }),
  },
  {
    label: "Last Month",
    fn: () => {
      const d = subMonths(new Date(), 1);
      return { start: startOfMonth(d), end: endOfMonth(d) };
    },
  },
  {
    label: "90d",
    fn: () => ({ start: subDays(new Date(), 89), end: new Date() }),
  },
];

interface InsightsFiltersProps {
  models: any[];
  platforms: string[];
  selectedModel: string;
  setSelectedModel: (v: string) => void;
  selectedPlatform: string;
  setSelectedPlatform: (v: string) => void;
  dateRange: { start: Date; end: Date };
  setDateRange: (v: { start: Date; end: Date }) => void;
}

export default function InsightsFilters({
  models,
  platforms,
  selectedModel,
  setSelectedModel,
  selectedPlatform,
  setSelectedPlatform,
  dateRange,
  setDateRange,
}: InsightsFiltersProps) {
  return (
    <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-3 sm:p-4 flex flex-col lg:flex-row items-start lg:items-center gap-2 sm:gap-3">
      <div className="flex gap-2 w-full lg:w-auto">
        <Select value={selectedModel} onValueChange={(v) => v !== null && setSelectedModel(v)}>
          <SelectTrigger className="flex-1 lg:w-44 h-9 bg-white/[0.03] border-white/[0.06] text-white text-xs sm:text-sm rounded-lg">
            <span className="truncate">{selectedModel === "all" ? "All Models" : (models.find((m: any) => m.id === selectedModel)?.first_name || "Select model")}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Models</SelectItem>
            {models.map((m: any) => (
              <SelectItem key={m.id} value={m.id}>
                {m.first_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedPlatform} onValueChange={(v) => v !== null && setSelectedPlatform(v)}>
          <SelectTrigger className="flex-1 lg:w-44 h-9 bg-white/[0.03] border-white/[0.06] text-white text-xs sm:text-sm rounded-lg">
            <SelectValue placeholder="All Sites" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sites</SelectItem>
            {platforms.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="h-5 w-px bg-white/[0.06] hidden lg:block" />

      <CalendarDays className="w-4 h-4 text-[#A8A49A]/30 hidden lg:block" />
      <div className="flex items-center gap-2 w-full lg:w-auto">
        <Input
          type="date"
          value={format(dateRange.start, "yyyy-MM-dd")}
          onChange={(e) =>
            setDateRange({
              ...dateRange,
              start: new Date(e.target.value + "T00:00:00"),
            })
          }
          className="flex-1 lg:w-40 h-9 text-xs bg-white/[0.03] border-white/[0.06] text-white rounded-lg pr-2 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
        />
        <span className="text-[#A8A49A]/30 text-xs">&rarr;</span>
        <Input
          type="date"
          value={format(dateRange.end, "yyyy-MM-dd")}
          onChange={(e) =>
            setDateRange({
              ...dateRange,
              end: new Date(e.target.value + "T23:59:59"),
            })
          }
          className="flex-1 lg:w-40 h-9 text-xs bg-white/[0.03] border-white/[0.06] text-white rounded-lg pr-2 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
        />
      </div>

      <div className="flex items-center gap-1 lg:ml-auto flex-wrap">
        {PRESETS.map((p) => (
          <Button
            key={p.label}
            variant="ghost"
            size="sm"
            onClick={() => setDateRange(p.fn())}
            className="h-7 px-2.5 text-[10px] text-[#A8A49A]/50 hover:text-white hover:bg-white/[0.04]"
          >
            {p.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
