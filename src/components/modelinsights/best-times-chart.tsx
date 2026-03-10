"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { Sparkles } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface BestTimesChartProps {
  streamStats: any[];
}

export default function BestTimesChart({ streamStats }: BestTimesChartProps) {
  const hourlyPrivate: Record<number, number> = {};
  HOURS.forEach((h) => {
    hourlyPrivate[h] = 0;
  });

  streamStats.forEach((stat: any) => {
    const privateMins =
      (stat.private_chat_minutes || 0) +
      (stat.nude_chat_minutes || 0) +
      (stat.semiprivate_minutes || 0) +
      (stat.vip_chat_minutes || 0) +
      (stat.true_private_minutes || 0) +
      (stat.paid_chat_minutes || 0);
    if (!stat.date || privateMins <= 0) return;
    const weights = [
      0.5, 0.3, 0.2, 0.1, 0.1, 0.1, 0.2, 0.3, 0.5, 0.8, 1.0, 1.2,
      1.5, 1.8, 2.0, 2.2, 2.5, 2.8, 3.0, 3.5, 3.2, 2.8, 2.0, 1.0,
    ];
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    weights.forEach((w, h) => {
      hourlyPrivate[h] += (privateMins * w) / totalWeight;
    });
  });

  const data = HOURS.map((h) => ({
    hour: `${String(h).padStart(2, "0")}:00`,
    minutes: Math.round(hourlyPrivate[h]),
  }));

  const maxVal = Math.max(...data.map((d) => d.minutes), 1);
  const bestHours = [...data]
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 3);

  return (
    <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-[#A8A49A]/40 font-medium tracking-wide mb-1">
            Best Private Show Hours
          </p>
          <p className="text-[10px] text-[#A8A49A]/25">
            When private shows happen most &mdash; recommended streaming
            times
          </p>
        </div>
        <Sparkles className="w-4 h-4 text-[#C9A84C]/40" />
      </div>

      {bestHours[0]?.minutes > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {bestHours
            .filter((h) => h.minutes > 0)
            .map((h, i) => (
              <div
                key={i}
                className="px-3 py-1.5 bg-[#C9A84C]/8 border border-[#C9A84C]/15 rounded-lg"
              >
                <span className="text-xs text-[#C9A84C] font-medium">
                  {h.hour}
                </span>
                <span className="text-[10px] text-[#A8A49A]/30 ml-1.5">
                  {h.minutes}min
                </span>
              </div>
            ))}
        </div>
      )}

      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 0, right: 0, left: -25, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.02)"
              vertical={false}
            />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 9, fill: "rgba(168,164,154,0.3)" }}
              tickLine={false}
              axisLine={false}
              interval={2}
            />
            <YAxis
              tick={{ fontSize: 9, fill: "rgba(168,164,154,0.25)" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1a1a1a",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "10px",
                fontSize: "11px",
                color: "white",
              }}
              labelStyle={{ color: "rgba(168,164,154,0.6)" }}
              itemStyle={{ color: "white" }}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              formatter={(v: any) => [`${v} min`, "Private Shows"]}
            />
            <Bar dataKey="minutes" radius={[3, 3, 0, 0]}>
              {data.map((d, i) => {
                const intensity = maxVal > 0 ? d.minutes / maxVal : 0;
                const opacity = 0.15 + intensity * 0.7;
                return (
                  <Cell key={i} fill="#EC4899" fillOpacity={opacity} />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
