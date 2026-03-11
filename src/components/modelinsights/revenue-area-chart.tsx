"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { eachDayOfInterval, format } from "date-fns";
import { motion } from "framer-motion";
import { TrendingUp, BarChart3, Activity } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */

const RevenueTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a]/95 backdrop-blur-md border border-white/[0.08] rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-[10px] text-[#A8A49A]/50 mb-1.5 font-medium">
        {label}
      </p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: p.color || p.stroke }}
          />
          <span className="text-[11px] text-[#A8A49A]/50">
            {p.dataKey === "revenue"
              ? "Gross"
              : p.dataKey === "modelPay"
                ? "Model Pay"
                : p.dataKey === "cumulative"
                  ? "Running Total"
                  : p.dataKey}
            :
          </span>
          <span className="text-[11px] text-white font-medium ml-auto">
            ${p.value.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
};

const StreamTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a]/95 backdrop-blur-md border border-white/[0.08] rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-[10px] text-[#A8A49A]/50 mb-1.5 font-medium">
        {label}
      </p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 py-0.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: p.color || p.stroke }}
          />
          <span className="text-[11px] text-[#A8A49A]/50">
            {p.dataKey === "totalHours"
              ? "Total"
              : p.dataKey === "privateHours"
                ? "Private"
                : p.dataKey === "cumulativeHours"
                  ? "Running Total"
                  : p.dataKey}
            :
          </span>
          <span className="text-[11px] text-white font-medium ml-auto">
            {p.value.toFixed(1)}h
          </span>
        </div>
      ))}
    </div>
  );
};

interface RevenueAreaChartProps {
  earnings: any[];
  streamStats?: any[];
  dateRange: { start: Date; end: Date };
}

export default function RevenueAreaChart({
  earnings,
  streamStats = [],
  dateRange,
}: RevenueAreaChartProps) {
  const [mode, setMode] = useState("area"); // area, bar, cumulative

  const hasEarnings = useMemo(
    () => earnings.some((e: any) => (e.total_gross_usd || 0) > 0),
    [earnings]
  );

  const days = eachDayOfInterval({
    start: dateRange.start,
    end: dateRange.end,
  });

  // Revenue data (original behavior)
  const revenueData = useMemo(() => {
    let running = 0;
    return days.map((d) => {
      const key = format(d, "yyyy-MM-dd");
      const dayEarnings = earnings.filter((e: any) => e.shift_date === key);
      const rev = dayEarnings.reduce(
        (s: number, e: any) => s + (e.total_gross_usd || 0),
        0
      );
      running += rev;
      return {
        date: key,
        label: format(d, days.length > 21 ? "d" : "MMM d"),
        revenue: rev,
        modelPay: dayEarnings.reduce(
          (s: number, e: any) => s + (e.model_pay_usd || 0),
          0
        ),
        cumulative: Math.round(running * 100) / 100,
      };
    });
  }, [days, earnings]);

  // Stream time data (fallback when no earnings)
  const streamData = useMemo(() => {
    let runningHours = 0;
    return days.map((d) => {
      const key = format(d, "yyyy-MM-dd");
      const dayStats = streamStats.filter((s: any) => s.date === key);
      const totalMins = dayStats.reduce(
        (s: number, st: any) => s + (st.total_minutes || 0),
        0
      );
      const privateMins = dayStats.reduce(
        (s: number, st: any) =>
          s +
          (st.private_chat_minutes || 0) +
          (st.nude_chat_minutes || 0) +
          (st.semiprivate_minutes || 0) +
          (st.vip_chat_minutes || 0) +
          (st.true_private_minutes || 0) +
          (st.paid_chat_minutes || 0),
        0
      );
      const totalHours = Math.round((totalMins / 60) * 10) / 10;
      const privateHours = Math.round((privateMins / 60) * 10) / 10;
      runningHours += totalHours;
      return {
        date: key,
        label: format(d, days.length > 21 ? "d" : "MMM d"),
        totalHours,
        privateHours,
        cumulativeHours: Math.round(runningHours * 10) / 10,
      };
    });
  }, [days, streamStats]);

  const total = revenueData.reduce((s, d) => s + d.revenue, 0);
  const totalStreamHours = streamData.reduce((s, d) => s + d.totalHours, 0);
  const maxRevVal = Math.max(...revenueData.map((d) => d.revenue), 1);
  const maxStreamVal = Math.max(...streamData.map((d) => d.totalHours), 0.1);

  // Use stream time view when no earnings exist
  const showStreamFallback = !hasEarnings && totalStreamHours > 0;
  const isEmpty = total === 0 && totalStreamHours === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="bg-[#111111] border border-white/[0.04] rounded-xl p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-[#A8A49A]/40 font-medium tracking-wide mb-1">
            {showStreamFallback ? "Stream Time Over Time" : "Revenue Over Time"}
          </p>
          <p className="text-2xl font-semibold text-white">
            {showStreamFallback ? (
              <>{Math.round(totalStreamHours * 10) / 10}h</>
            ) : (
              <>
                $
                {new Intl.NumberFormat("en-US", {
                  minimumFractionDigits: 0,
                }).format(total)}
              </>
            )}
          </p>
        </div>
        <div className="flex bg-white/[0.03] rounded-lg p-0.5 border border-white/[0.04]">
          {[
            { key: "area", icon: TrendingUp },
            { key: "bar", icon: BarChart3 },
            { key: "cumulative", icon: Activity },
          ].map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setMode(key)}
              className={`p-1.5 rounded-md transition-colors ${
                mode === key
                  ? "bg-[#C9A84C]/15 text-[#C9A84C]"
                  : "text-[#A8A49A]/30 hover:text-white"
              }`}
              title={key === "cumulative" ? "Running Total" : key}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>
      <div className="h-72">
        {isEmpty ? (
          <div className="h-full flex items-center justify-center text-[#A8A49A]/20 text-sm">
            No data available
          </div>
        ) : showStreamFallback ? (
          /* Stream time fallback charts */
          <ResponsiveContainer width="100%" height="100%">
            {mode === "area" ? (
              <AreaChart
                data={streamData}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="streamTotalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="streamPvtGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EC4899" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#EC4899" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "rgba(168,164,154,0.35)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: "rgba(168,164,154,0.35)" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}h`} />
                <Tooltip content={<StreamTooltip />} />
                <Area type="monotone" dataKey="totalHours" stroke="#3B82F6" strokeWidth={2} fill="url(#streamTotalGrad)" dot={false} activeDot={{ r: 4, fill: "#3B82F6", stroke: "#0A0A0A", strokeWidth: 2 }} animationDuration={1200} />
                <Area type="monotone" dataKey="privateHours" stroke="#EC4899" strokeWidth={1.5} fill="url(#streamPvtGrad)" dot={false} activeDot={{ r: 4, fill: "#EC4899", stroke: "#0A0A0A", strokeWidth: 2 }} animationDuration={1400} />
              </AreaChart>
            ) : mode === "bar" ? (
              <BarChart
                data={streamData}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "rgba(168,164,154,0.35)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: "rgba(168,164,154,0.35)" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}h`} />
                <Tooltip content={<StreamTooltip />} />
                <Bar dataKey="totalHours" radius={[4, 4, 0, 0]} animationDuration={800}>
                  {streamData.map((d, i) => {
                    const intensity = maxStreamVal > 0 ? d.totalHours / maxStreamVal : 0;
                    return <Cell key={i} fill="#3B82F6" fillOpacity={0.2 + intensity * 0.6} />;
                  })}
                </Bar>
              </BarChart>
            ) : (
              <ComposedChart
                data={streamData}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="cumStreamGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "rgba(168,164,154,0.35)" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: "rgba(168,164,154,0.35)" }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}h`} />
                <Tooltip content={<StreamTooltip />} />
                <Area type="monotone" dataKey="cumulativeHours" stroke="#10B981" strokeWidth={2} fill="url(#cumStreamGrad)" dot={false} activeDot={{ r: 4, fill: "#10B981", stroke: "#0A0A0A", strokeWidth: 2 }} animationDuration={1200} />
                <Bar dataKey="totalHours" fill="#3B82F6" fillOpacity={0.15} radius={[3, 3, 0, 0]} animationDuration={800} />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        ) : (
          /* Revenue charts (original) */
          <ResponsiveContainer width="100%" height="100%">
            {mode === "area" ? (
              <AreaChart
                data={revenueData}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="insRevGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#C9A84C"
                      stopOpacity={0.35}
                    />
                    <stop
                      offset="100%"
                      stopColor="#C9A84C"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient
                    id="insPayGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#8B5CF6"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="100%"
                      stopColor="#8B5CF6"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
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
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "rgba(168,164,154,0.35)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1000
                      ? `$${(v / 1000).toFixed(0)}k`
                      : `$${v}`
                  }
                />
                <Tooltip content={<RevenueTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#C9A84C"
                  strokeWidth={2}
                  fill="url(#insRevGrad)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "#C9A84C",
                    stroke: "#0A0A0A",
                    strokeWidth: 2,
                  }}
                  animationDuration={1200}
                />
                <Area
                  type="monotone"
                  dataKey="modelPay"
                  stroke="#8B5CF6"
                  strokeWidth={1.5}
                  fill="url(#insPayGrad)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "#8B5CF6",
                    stroke: "#0A0A0A",
                    strokeWidth: 2,
                  }}
                  animationDuration={1400}
                />
              </AreaChart>
            ) : mode === "bar" ? (
              <BarChart
                data={revenueData}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
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
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "rgba(168,164,154,0.35)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1000
                      ? `$${(v / 1000).toFixed(0)}k`
                      : `$${v}`
                  }
                />
                <Tooltip content={<RevenueTooltip />} />
                <Bar
                  dataKey="revenue"
                  radius={[4, 4, 0, 0]}
                  animationDuration={800}
                >
                  {revenueData.map((d, i) => {
                    const intensity =
                      maxRevVal > 0 ? d.revenue / maxRevVal : 0;
                    return (
                      <Cell
                        key={i}
                        fill="#C9A84C"
                        fillOpacity={0.2 + intensity * 0.6}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            ) : (
              <ComposedChart
                data={revenueData}
                margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="cumGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#10B981"
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="100%"
                      stopColor="#10B981"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
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
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "rgba(168,164,154,0.35)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) =>
                    v >= 1000
                      ? `$${(v / 1000).toFixed(0)}k`
                      : `$${v}`
                  }
                />
                <Tooltip content={<RevenueTooltip />} />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#10B981"
                  strokeWidth={2}
                  fill="url(#cumGrad)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: "#10B981",
                    stroke: "#0A0A0A",
                    strokeWidth: 2,
                  }}
                  animationDuration={1200}
                />
                <Bar
                  dataKey="revenue"
                  fill="#C9A84C"
                  fillOpacity={0.15}
                  radius={[3, 3, 0, 0]}
                  animationDuration={800}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}
