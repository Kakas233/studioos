"use client";

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { eachDayOfInterval, format } from "date-fns";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface EarningsPerHourChartProps {
  earnings: any[];
  streamStats: any[];
  dateRange: { start: Date; end: Date };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a]/95 backdrop-blur-md border border-white/[0.08] rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-[10px] text-[#A8A49A]/50 mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: p.color || p.stroke }}
          />
          <span className="text-[11px] text-[#A8A49A]/50">{p.name}:</span>
          <span className="text-[11px] text-white font-medium ml-auto">
            {p.name === "$/hr"
              ? `$${p.value}`
              : p.name === "Revenue"
                ? `$${p.value}`
                : `${p.value}h`}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function EarningsPerHourChart({
  earnings,
  streamStats,
  dateRange,
}: EarningsPerHourChartProps) {
  const days = eachDayOfInterval({
    start: dateRange.start,
    end: dateRange.end,
  });

  // Group by week for cleaner data
  const weekMap: Record<string, { label: string; revenue: number; hours: number }> = {};
  days.forEach((d) => {
    const weekKey = format(d, "w");
    const weekLabel = `W${format(d, "w")}`;
    if (!weekMap[weekKey])
      weekMap[weekKey] = { label: weekLabel, revenue: 0, hours: 0 };
    const dk = format(d, "yyyy-MM-dd");
    earnings
      .filter((e: any) => e.shift_date === dk)
      .forEach((e: any) => {
        weekMap[weekKey].revenue += e.total_gross_usd || 0;
      });
    streamStats
      .filter((s: any) => s.date === dk)
      .forEach((s: any) => {
        weekMap[weekKey].hours += (s.total_minutes || 0) / 60;
      });
  });

  const data = Object.values(weekMap).map((w) => ({
    ...w,
    perHour:
      w.hours > 0 ? Math.round((w.revenue / w.hours) * 100) / 100 : 0,
    hours: Math.round(w.hours * 10) / 10,
    revenue: Math.round(w.revenue * 100) / 100,
  }));

  return (
    <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-5">
      <p className="text-xs text-[#A8A49A]/40 font-medium tracking-wide mb-1">
        Earnings Efficiency
      </p>
      <p className="text-[10px] text-[#A8A49A]/25 mb-4">
        Weekly revenue, hours, and $/hour rate
      </p>
      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-[#A8A49A]/20 text-sm">
          No data
        </div>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.03)"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "rgba(168,164,154,0.35)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 10, fill: "rgba(168,164,154,0.3)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `$${v}`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 10, fill: "rgba(168,164,154,0.2)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v}h`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                yAxisId="left"
                dataKey="revenue"
                name="Revenue"
                fill="#C9A84C"
                fillOpacity={0.25}
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="hours"
                name="Hours"
                fill="#3B82F6"
                fillOpacity={0.2}
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="left"
                dataKey="perHour"
                name="$/hr"
                stroke="#10B981"
                strokeWidth={2}
                dot={{
                  r: 3,
                  fill: "#10B981",
                  stroke: "#0A0A0A",
                  strokeWidth: 2,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
