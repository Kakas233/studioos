"use client";

import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { format, eachDayOfInterval, subDays } from "date-fns";
import { motion } from "framer-motion";
import { TrendingUp, BarChart3 } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import type { Database } from "@/lib/supabase/types";

type Earning = Database["public"]["Tables"]["earnings"]["Row"];

interface DateRange {
  start: Date;
  end: Date;
}

interface RevenueChartProps {
  earnings: Earning[];
  dateRange: DateRange;
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; color?: string; stroke?: string; dataKey: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a]/95 backdrop-blur-md border border-white/[0.08] rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-[10px] text-[#A8A49A]/50 mb-1.5 font-medium">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.stroke }} />
          <span className="text-[11px] text-[#A8A49A]/50">{p.dataKey === "gross_usd" ? "Revenue" : p.dataKey}:</span>
          <span className="text-[11px] text-white font-medium ml-auto">
            ${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2 }).format(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function RevenueChart({ earnings, dateRange }: RevenueChartProps) {
  const [chartType, setChartType] = useState<"area" | "bar">("area");
  const { formatSecondary } = useCurrency();
  const startDate = dateRange?.start || subDays(new Date(), 29);
  const endDate = dateRange?.end || new Date();

  const days = eachDayOfInterval({ start: startDate, end: endDate });
  const rangeData = days.map((d) => ({
    date: format(d, "yyyy-MM-dd"),
    displayDate: format(d, "MMM d"),
    shortDate: format(d, "d"),
    gross_usd: 0,
    gross_secondary: 0,
  }));

  if (earnings?.length) {
    earnings.forEach((e) => {
      if (!e.shift_date) return;
      const idx = rangeData.findIndex((d) => d.date === e.shift_date);
      if (idx !== -1) {
        rangeData[idx].gross_usd += Number(e.total_gross_usd) || 0;
        rangeData[idx].gross_secondary += Number(e.total_gross_secondary) || 0;
      }
    });
  }

  const totalUsd = rangeData.reduce((s, d) => s + d.gross_usd, 0);
  const totalSecondary = rangeData.reduce((s, d) => s + d.gross_secondary, 0);
  const maxVal = Math.max(...rangeData.map((d) => d.gross_usd), 1);

  const fmtUsd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(totalUsd);
  const fmtSecondary = formatSecondary(totalSecondary);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-[#111111] border border-white/[0.04] rounded-xl p-5"
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs text-[#A8A49A]/40 font-medium tracking-wide mb-1">Revenue</p>
          <p className="text-2xl font-semibold text-white">{fmtUsd}</p>
          <p className="text-xs text-[#A8A49A]/30 mt-0.5">{fmtSecondary}</p>
        </div>
        <div className="flex bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.04]">
          <button
            onClick={() => setChartType("area")}
            className={`p-1.5 rounded-md transition-colors ${chartType === "area" ? "bg-[#C9A84C]/15 text-[#C9A84C]" : "text-[#A8A49A]/30 hover:text-[#e8e6e3]"}`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setChartType("bar")}
            className={`p-1.5 rounded-md transition-colors ${chartType === "bar" ? "bg-[#C9A84C]/15 text-[#C9A84C]" : "text-[#A8A49A]/30 hover:text-[#e8e6e3]"}`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="h-56 sm:h-72">
        {totalUsd === 0 && totalSecondary === 0 ? (
          <div className="h-full flex items-center justify-center text-[#A8A49A]/20 text-sm">
            No revenue data for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "area" ? (
              <AreaChart data={rangeData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C9A84C" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#C9A84C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis
                  dataKey={rangeData.length > 14 ? "shortDate" : "displayDate"}
                  tick={{ fontSize: 10, fill: "rgba(168,164,154,0.35)" }}
                  tickLine={false} axisLine={false} interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10, fill: "rgba(168,164,154,0.35)" }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="gross_usd" stroke="#C9A84C" strokeWidth={2} fill="url(#dashRevGrad)" dot={false}
                  activeDot={{ r: 5, fill: "#C9A84C", stroke: "#0A0A0A", strokeWidth: 2 }}
                  animationDuration={1200} animationEasing="ease-out"
                />
              </AreaChart>
            ) : (
              <BarChart data={rangeData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis
                  dataKey={rangeData.length > 14 ? "shortDate" : "displayDate"}
                  tick={{ fontSize: 10, fill: "rgba(168,164,154,0.35)" }}
                  tickLine={false} axisLine={false} interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 10, fill: "rgba(168,164,154,0.35)" }} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="gross_usd" radius={[4, 4, 0, 0]} animationDuration={800}>
                  {rangeData.map((d, i) => {
                    const intensity = maxVal > 0 ? d.gross_usd / maxVal : 0;
                    return <Cell key={i} fill="#C9A84C" fillOpacity={0.2 + intensity * 0.6} />;
                  })}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
