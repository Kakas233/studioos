"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { GRANULAR_STAT_FIELDS, getShowType } from "@/lib/show-types";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface StreamTimeChartProps {
  stats: any[];
}

export default function StreamTimeChart({ stats }: StreamTimeChartProps) {
  const { data, activeTypes } = useMemo(() => {
    const dateMap: Record<string, Record<string, number>> = {};
    const typeTotals: Record<string, number> = {};

    stats.forEach((s: any) => {
      if (!s.date) return;
      if (!dateMap[s.date]) dateMap[s.date] = {};

      for (const [field, showType] of Object.entries(GRANULAR_STAT_FIELDS)) {
        const mins = s[field] || 0;
        if (mins > 0) {
          dateMap[s.date][showType] =
            (dateMap[s.date][showType] || 0) + mins;
          typeTotals[showType] = (typeTotals[showType] || 0) + mins;
        }
      }
    });

    const active = Object.entries(typeTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([type]) => type);

    const chartData = Object.entries(dateMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => {
        const entry: Record<string, any> = {
          date,
          label: format(
            parseISO(date),
            Object.keys(dateMap).length > 14 ? "d" : "MMM d"
          ),
        };
        active.forEach((type) => {
          const cfg = getShowType(type);
          entry[cfg.label] =
            Math.round(((vals[type] || 0) / 60) * 10) / 10;
        });
        return entry;
      });

    return { data: chartData, activeTypes: active };
  }, [stats]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#1a1a1a]/95 backdrop-blur-md border border-white/[0.08] rounded-xl px-4 py-3 shadow-2xl">
        <p className="text-[10px] text-[#A8A49A]/50 mb-1.5 font-medium">
          {label}
        </p>
        {payload
          .filter((p: any) => p.value > 0)
          .map((p: any, i: number) => (
            <div key={i} className="flex items-center gap-2 py-0.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: p.fill || p.color }}
              />
              <span className="text-[11px] text-[#A8A49A]/50">
                {p.name}:
              </span>
              <span className="text-[11px] text-white font-medium ml-auto">
                {p.value}h
              </span>
            </div>
          ))}
      </div>
    );
  };

  if (data.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-[#111111] border border-white/[0.04] rounded-xl p-5"
    >
      <p className="text-xs text-[#A8A49A]/40 font-medium tracking-wide mb-4">
        Daily Stream Hours by Show Type
      </p>
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
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
              tickFormatter={(v) => `${v}h`}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(255,255,255,0.03)" }}
            />
            <Legend
              wrapperStyle={{
                fontSize: "10px",
                color: "rgba(168,164,154,0.4)",
              }}
              iconType="circle"
              iconSize={6}
            />
            {activeTypes.map((type, i) => {
              const cfg = getShowType(type);
              return (
                <Bar
                  key={type}
                  dataKey={cfg.label}
                  stackId="a"
                  fill={cfg.chartColor}
                  fillOpacity={0.6}
                  radius={
                    i === activeTypes.length - 1
                      ? [4, 4, 0, 0]
                      : [0, 0, 0, 0]
                  }
                  animationDuration={800 + i * 50}
                />
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
