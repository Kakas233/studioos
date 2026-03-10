"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface RevenueScatterPlotProps {
  earnings: any[];
  streamStats: any[];
}

export default function RevenueScatterPlot({
  earnings,
  streamStats,
}: RevenueScatterPlotProps) {
  // Build scatter data: x = stream hours, y = revenue, z = private ratio
  const dateMap: Record<string, { hours: number; pvtMins: number }> = {};

  streamStats.forEach((s: any) => {
    if (!s.date) return;
    if (!dateMap[s.date]) dateMap[s.date] = { hours: 0, pvtMins: 0 };
    dateMap[s.date].hours += (s.total_minutes || 0) / 60;
    dateMap[s.date].pvtMins +=
      (s.private_chat_minutes || 0) +
      (s.nude_chat_minutes || 0) +
      (s.semiprivate_minutes || 0) +
      (s.vip_chat_minutes || 0) +
      (s.true_private_minutes || 0) +
      (s.paid_chat_minutes || 0);
  });

  const data = Object.entries(dateMap)
    .map(([date, d]) => {
      const dayEarnings = earnings.filter((e: any) => e.shift_date === date);
      const revenue = dayEarnings.reduce(
        (s: number, e: any) => s + (e.total_gross_usd || 0),
        0
      );
      const pvtRatio =
        d.hours > 0 ? (d.pvtMins / (d.hours * 60)) * 100 : 0;
      return {
        date,
        hours: Math.round(d.hours * 10) / 10,
        revenue: Math.round(revenue * 100) / 100,
        pvtRatio: Math.round(pvtRatio),
      };
    })
    .filter((d) => d.hours > 0 || d.revenue > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-[#1a1a1a]/95 backdrop-blur-md border border-white/[0.08] rounded-xl px-4 py-3 shadow-2xl">
        <p className="text-[10px] text-[#A8A49A]/50 mb-1.5">{d.date}</p>
        <div className="space-y-1">
          <p className="text-[11px] text-white">
            Stream: <span className="font-medium">{d.hours}h</span>
          </p>
          <p className="text-[11px] text-[#C9A84C]">
            Revenue: <span className="font-medium">${d.revenue}</span>
          </p>
          <p className="text-[11px] text-pink-400">
            Private: <span className="font-medium">{d.pvtRatio}%</span>
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-5">
      <div className="mb-4">
        <p className="text-xs text-[#A8A49A]/40 font-medium tracking-wide mb-1">
          Hours vs Revenue Correlation
        </p>
        <p className="text-[10px] text-[#A8A49A]/25">
          Bubble size = private show ratio
        </p>
      </div>
      {data.length === 0 ? (
        <div className="h-52 flex items-center justify-center text-[#A8A49A]/20 text-sm">
          No correlation data
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              margin={{ top: 5, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.03)"
              />
              <XAxis
                dataKey="hours"
                type="number"
                name="Hours"
                tick={{ fontSize: 10, fill: "rgba(168,164,154,0.35)" }}
                tickLine={false}
                axisLine={false}
                label={{
                  value: "Stream Hours",
                  position: "bottom",
                  offset: -5,
                  style: {
                    fontSize: 9,
                    fill: "rgba(168,164,154,0.25)",
                  },
                }}
              />
              <YAxis
                dataKey="revenue"
                type="number"
                name="Revenue"
                tick={{ fontSize: 10, fill: "rgba(168,164,154,0.35)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `$${v}`}
              />
              <ZAxis dataKey="pvtRatio" range={[30, 300]} name="Pvt %" />
              <Tooltip content={<CustomTooltip />} />
              <Scatter
                data={data}
                fill="#C9A84C"
                fillOpacity={0.6}
                stroke="#C9A84C"
                strokeOpacity={0.3}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
