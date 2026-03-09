"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarDays } from "lucide-react";
import { format, startOfMonth, endOfMonth, subDays, subMonths } from "date-fns";

interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangeSelectorProps {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
}

const PRESETS = [
  { label: "Today", fn: () => { const n = new Date(); return { start: n, end: n }; } },
  { label: "7d", fn: () => ({ start: subDays(new Date(), 6), end: new Date() }) },
  { label: "30d", fn: () => ({ start: subDays(new Date(), 29), end: new Date() }) },
  { label: "This Month", fn: () => ({ start: startOfMonth(new Date()), end: endOfMonth(new Date()) }) },
  { label: "Last Month", fn: () => { const d = subMonths(new Date(), 1); return { start: startOfMonth(d), end: endOfMonth(d) }; } },
];

export default function DateRangeSelector({ dateRange, setDateRange }: DateRangeSelectorProps) {
  return (
    <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
      <CalendarDays className="w-4 h-4 text-[#A8A49A]/40 hidden sm:block" />
      <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
        <Input
          type="date"
          value={format(dateRange.start, "yyyy-MM-dd")}
          onChange={(e) => setDateRange({ ...dateRange, start: new Date(e.target.value + "T00:00:00") })}
          className="flex-1 sm:flex-none sm:w-40 h-8 text-xs bg-white/[0.03] border-white/[0.06] text-white rounded-lg pr-2 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
        />
        <span className="text-[#A8A49A]/30 text-xs">{"\u2192"}</span>
        <Input
          type="date"
          value={format(dateRange.end, "yyyy-MM-dd")}
          onChange={(e) => setDateRange({ ...dateRange, end: new Date(e.target.value + "T23:59:59") })}
          className="flex-1 sm:flex-none sm:w-40 h-8 text-xs bg-white/[0.03] border-white/[0.06] text-white rounded-lg pr-2 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
        />
      </div>
      <div className="flex items-center gap-1 sm:gap-1.5 sm:ml-auto flex-wrap">
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
