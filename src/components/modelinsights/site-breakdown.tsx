"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { motion } from "framer-motion";
import { fmtDuration } from "@/lib/show-types";

/* eslint-disable @typescript-eslint/no-explicit-any */

const SITE_KEYS = [
  "myfreecams",
  "chaturbate",
  "stripchat",
  "bongacams",
  "cam4",
  "camsoda",
  "flirt4free",
  "livejasmin",
];

const SITE_COLORS: Record<string, string> = {
  myfreecams: "#006E00",
  chaturbate: "#F47421",
  stripchat: "#A2242D",
  bongacams: "#A02239",
  cam4: "#FC531D",
  camsoda: "#01B0FA",
  flirt4free: "#2D91AF",
  livejasmin: "#BA0000",
};

const SITE_LABELS: Record<string, string> = {
  myfreecams: "MyFreeCams",
  chaturbate: "Chaturbate",
  stripchat: "Stripchat",
  bongacams: "BongaCams",
  cam4: "Cam4",
  camsoda: "CamSoda",
  flirt4free: "Flirt4Free",
  livejasmin: "LiveJasmin",
};

const RevenueTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#1a1a1a] border border-white/[0.1] rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-[11px] text-white/80 font-medium">{d.site}</p>
      <p className="text-[11px] text-[#C9A84C]">${d.revenue.toFixed(2)}</p>
    </div>
  );
};

const StreamTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#1a1a1a] border border-white/[0.1] rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-[11px] text-white/80 font-medium">{d.site}</p>
      <p className="text-[11px] text-[#3B82F6]">{fmtDuration(d.minutes)}</p>
    </div>
  );
};

interface SiteBreakdownProps {
  earnings: any[];
  streamStats?: any[];
  camPlatformMap?: Record<string, string>;
}

export default function SiteBreakdown({
  earnings,
  streamStats = [],
  camPlatformMap = {},
}: SiteBreakdownProps) {
  // Revenue-based site data
  const siteRevenueData = useMemo(() => {
    return SITE_KEYS.map((site) => {
      const total = earnings.reduce(
        (s: number, e: any) => s + (e[`${site}_usd`] || 0),
        0
      );
      return {
        site: SITE_LABELS[site] || site.charAt(0).toUpperCase() + site.slice(1),
        key: site,
        revenue: Math.round(total * 100) / 100,
      };
    })
      .filter((d) => d.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue);
  }, [earnings]);

  // Stream time by platform (from daily_stream_stats + camPlatformMap)
  const platformStreamData = useMemo(() => {
    const platformMins: Record<string, number> = {};
    streamStats.forEach((stat: any) => {
      const platform = stat.platform || camPlatformMap[stat.cam_account_id];
      if (!platform) return;
      const key = platform.toLowerCase();
      platformMins[key] = (platformMins[key] || 0) + (stat.total_minutes || 0);
    });

    return Object.entries(platformMins)
      .filter(([, mins]) => mins > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([key, minutes]) => ({
        site: SITE_LABELS[key] || key.charAt(0).toUpperCase() + key.slice(1),
        key,
        minutes: Math.round(minutes),
      }));
  }, [streamStats, camPlatformMap]);

  const hasRevenueData = siteRevenueData.length > 0;
  const hasStreamData = platformStreamData.length > 0;
  const revenueTotal = siteRevenueData.reduce((s, d) => s + d.revenue, 0);
  const streamTotal = platformStreamData.reduce((s, d) => s + d.minutes, 0);

  // Show revenue if available, otherwise stream time
  if (!hasRevenueData && !hasStreamData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="bg-[#111111] border border-white/[0.04] rounded-xl p-5"
      >
        <p className="text-xs text-[#A8A49A]/40 font-medium tracking-wide mb-1">
          Platform Breakdown
        </p>
        <div className="h-48 flex items-center justify-center text-[#A8A49A]/20 text-sm">
          No data available
        </div>
      </motion.div>
    );
  }

  if (hasRevenueData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="bg-[#111111] border border-white/[0.04] rounded-xl p-5"
      >
        <p className="text-xs text-[#A8A49A]/40 font-medium tracking-wide mb-1">
          Revenue by Site
        </p>
        <p className="text-lg font-semibold text-white mb-4">
          $
          {new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 0,
          }).format(revenueTotal)}
        </p>
        <div className="h-44 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={siteRevenueData}
              margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
            >
              <XAxis
                dataKey="site"
                tick={{ fontSize: 10, fill: "rgba(168,164,154,0.4)" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "rgba(168,164,154,0.3)" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `$${v}`}
              />
              <Tooltip
                content={<RevenueTooltip />}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              <Bar
                dataKey="revenue"
                radius={[4, 4, 0, 0]}
                animationDuration={900}
                animationEasing="ease-out"
              >
                {siteRevenueData.map((d) => (
                  <Cell
                    key={d.key}
                    fill={SITE_COLORS[d.key] || "#C9A84C"}
                    fillOpacity={0.7}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-1.5">
          {siteRevenueData.map((d, i) => {
            const pct =
              revenueTotal > 0
                ? ((d.revenue / revenueTotal) * 100).toFixed(1)
                : "0";
            return (
              <div key={d.key} className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: SITE_COLORS[d.key] || "#C9A84C",
                  }}
                />
                <span className="text-xs text-[#A8A49A]/50 flex-1">
                  {d.site}
                </span>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                  className="flex-[2] h-1 bg-white/[0.03] rounded-full overflow-hidden"
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor:
                        SITE_COLORS[d.key] || "#C9A84C",
                    }}
                  />
                </motion.div>
                <span className="text-xs text-white font-medium w-12 text-right">
                  ${d.revenue.toFixed(0)}
                </span>
                <span className="text-[10px] text-[#A8A49A]/30 w-10 text-right">
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // Stream time fallback
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="bg-[#111111] border border-white/[0.04] rounded-xl p-5"
    >
      <p className="text-xs text-[#A8A49A]/40 font-medium tracking-wide mb-1">
        Stream Time by Platform
      </p>
      <p className="text-lg font-semibold text-white mb-4">
        {fmtDuration(streamTotal)}
      </p>
      <div className="h-44 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={platformStreamData}
            margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
          >
            <XAxis
              dataKey="site"
              tick={{ fontSize: 10, fill: "rgba(168,164,154,0.4)" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "rgba(168,164,154,0.3)" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `${Math.round(v / 60)}h`}
            />
            <Tooltip
              content={<StreamTooltip />}
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
            />
            <Bar
              dataKey="minutes"
              radius={[4, 4, 0, 0]}
              animationDuration={900}
              animationEasing="ease-out"
            >
              {platformStreamData.map((d) => (
                <Cell
                  key={d.key}
                  fill={SITE_COLORS[d.key] || "#C9A84C"}
                  fillOpacity={0.7}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-1.5">
        {platformStreamData.map((d, i) => {
          const pct =
            streamTotal > 0
              ? ((d.minutes / streamTotal) * 100).toFixed(1)
              : "0";
          return (
            <div key={d.key} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: SITE_COLORS[d.key] || "#C9A84C",
                }}
              />
              <span className="text-xs text-[#A8A49A]/50 flex-1">
                {d.site}
              </span>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                className="flex-[2] h-1 bg-white/[0.03] rounded-full overflow-hidden"
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${pct}%`,
                    backgroundColor:
                      SITE_COLORS[d.key] || "#C9A84C",
                  }}
                />
              </motion.div>
              <span className="text-xs text-white font-medium w-14 text-right">
                {fmtDuration(d.minutes)}
              </span>
              <span className="text-[10px] text-[#A8A49A]/30 w-10 text-right">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
