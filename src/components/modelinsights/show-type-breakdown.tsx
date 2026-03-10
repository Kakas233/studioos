"use client";

import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import { motion } from "framer-motion";
import {
  GRANULAR_STAT_FIELDS,
  getShowType,
  fmtDuration,
} from "@/lib/show-types";

/* eslint-disable @typescript-eslint/no-explicit-any */

const ActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
  } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 4}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.3}
      />
      <text
        x={cx}
        y={cy - 8}
        textAnchor="middle"
        fill="white"
        fontSize={14}
        fontWeight={600}
      >
        {payload.name}
      </text>
      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        fill="rgba(168,164,154,0.5)"
        fontSize={11}
      >
        {(percent * 100).toFixed(1)}%
      </text>
    </g>
  );
};

interface ShowTypeBreakdownProps {
  streamStats: any[];
}

export default function ShowTypeBreakdown({
  streamStats,
}: ShowTypeBreakdownProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const { data, total } = useMemo(() => {
    const totals: Record<string, number> = {};

    for (const s of streamStats) {
      for (const [field, showType] of Object.entries(GRANULAR_STAT_FIELDS)) {
        const mins = s[field] || 0;
        if (mins > 0) {
          if (!totals[showType]) totals[showType] = 0;
          totals[showType] += mins;
        }
      }
      // Add away/break
      const awayMins = s.away_minutes || s.break_minutes || 0;
      if (awayMins > 0) {
        totals["away"] = (totals["away"] || 0) + awayMins;
      }
    }

    // Fall back to total_minutes if no granular data found
    if (Object.keys(totals).length === 0) {
      for (const s of streamStats) {
        if (s.total_minutes > 0)
          totals["free_chat"] =
            (totals["free_chat"] || 0) + s.total_minutes;
      }
    }

    const items = Object.entries(totals)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([type, value]) => {
        const cfg = getShowType(type);
        return {
          name: cfg.label,
          value,
          color: cfg.chartColor,
          showType: type,
        };
      });

    return {
      data: items,
      total: items.reduce((s, d) => s + d.value, 0),
    };
  }, [streamStats]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="bg-[#111111] border border-white/[0.04] rounded-xl p-5"
    >
      <p className="text-xs text-[#A8A49A]/40 font-medium tracking-wide mb-4">
        Show Type Breakdown
      </p>
      {total === 0 ? (
        <div className="h-48 flex items-center justify-center text-[#A8A49A]/20 text-sm">
          No stream data
        </div>
      ) : (
        <div className="flex items-center gap-6">
          <div className="w-44 h-44 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={63}
                  dataKey="value"
                  strokeWidth={0}
                  activeIndex={activeIdx ?? undefined}
                  activeShape={ActiveShape}
                  onMouseEnter={(_, i) => setActiveIdx(i)}
                  onMouseLeave={() => setActiveIdx(null)}
                  animationBegin={0}
                  animationDuration={1000}
                  animationEasing="ease-out"
                >
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {data.map((d, i) => {
              const pct = ((d.value / total) * 100).toFixed(1);
              const isActive = activeIdx === i;
              return (
                <div
                  key={d.name}
                  className={`flex items-center gap-3 transition-all ${
                    isActive ? "scale-[1.02]" : ""
                  }`}
                  onMouseEnter={() => setActiveIdx(i)}
                  onMouseLeave={() => setActiveIdx(null)}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="text-xs text-[#A8A49A]/60 w-24 truncate">
                    {d.name}
                  </span>
                  <div className="flex-1 h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{
                        duration: 0.8,
                        delay: i * 0.1,
                        ease: "easeOut",
                      }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: d.color }}
                    />
                  </div>
                  <span className="text-xs text-white font-medium w-14 text-right">
                    {fmtDuration(d.value)}
                  </span>
                  <span className="text-[10px] text-[#A8A49A]/30 w-10 text-right">
                    {pct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
