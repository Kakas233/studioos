"use client";

import { motion } from "framer-motion";
import AnimatedNumber from "@/components/shared/animated-number";
import { fmtDuration } from "@/lib/show-types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function fmtUsd(v: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v || 0);
}

interface TileDef {
  key: string;
  label: string;
}

const TILES: TileDef[] = [
  { key: "totalRevenue", label: "Total Revenue" },
  { key: "periodRevenue", label: "Period Revenue" },
  { key: "modelPay", label: "Model Payouts" },
  { key: "perHour", label: "Avg $/Hour" },
  { key: "totalOnline", label: "Total Stream Time" },
  { key: "publicTime", label: "Free Chat" },
  { key: "privateTime", label: "Private Shows" },
  { key: "groupTime", label: "Group Shows" },
];

interface InsightsStatTilesProps {
  earnings: any[];
  streamStats: any[];
  allEarnings?: any[];
}

export default function InsightsStatTiles({
  earnings,
  streamStats,
  allEarnings,
}: InsightsStatTilesProps) {
  const totalRevenue = (allEarnings || []).reduce(
    (s: number, e: any) => s + (e.total_gross_usd || 0),
    0
  );
  const periodRevenue = earnings.reduce(
    (s: number, e: any) => s + (e.total_gross_usd || 0),
    0
  );
  const modelPay = earnings.reduce(
    (s: number, e: any) => s + (e.model_pay_usd || 0),
    0
  );
  const totalOnline = streamStats.reduce(
    (s: number, d: any) => s + (d.total_minutes || 0),
    0
  );
  const publicTime = streamStats.reduce(
    (s: number, d: any) => s + (d.free_chat_minutes || 0),
    0
  );
  const privateTime = streamStats.reduce(
    (s: number, d: any) =>
      s +
      (d.private_chat_minutes || 0) +
      (d.nude_chat_minutes || 0) +
      (d.semiprivate_minutes || 0) +
      (d.vip_chat_minutes || 0) +
      (d.true_private_minutes || 0) +
      (d.paid_chat_minutes || 0),
    0
  );
  const groupTime = streamStats.reduce(
    (s: number, d: any) =>
      s +
      (d.member_chat_minutes || 0) +
      (d.group_chat_minutes || 0) +
      (d.happy_hour_minutes || 0) +
      (d.party_chat_minutes || 0) +
      (d.pre_gold_show_minutes || 0) +
      (d.gold_show_minutes || 0),
    0
  );
  const totalHours = totalOnline / 60;
  const perHour = totalHours > 0 ? periodRevenue / totalHours : 0;

  const numValues: Record<string, number> = {
    totalRevenue,
    periodRevenue,
    modelPay,
    perHour,
  };

  const strValues: Record<string, string> = {
    totalOnline: fmtDuration(totalOnline),
    publicTime: fmtDuration(publicTime),
    privateTime: fmtDuration(privateTime),
    groupTime: fmtDuration(groupTime),
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {TILES.map((t, i) => (
        <motion.div
          key={t.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.03 }}
          className="bg-[#111111] border border-white/[0.04] rounded-xl p-4 hover:border-white/[0.08] transition-colors"
        >
          <p className="text-[10px] text-[#A8A49A]/40 uppercase tracking-wider mb-2">
            {t.label}
          </p>
          <p className="text-lg font-semibold text-white">
            {numValues[t.key] !== undefined ? (
              <>
                $
                <AnimatedNumber
                  value={numValues[t.key]}
                  formatter={(v) => fmtUsd(v)}
                />
              </>
            ) : (
              strValues[t.key]
            )}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
