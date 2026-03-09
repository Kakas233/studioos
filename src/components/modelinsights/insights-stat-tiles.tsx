"use client";

import {
  DollarSign,
  Clock,
  Eye,
  Lock,
  Users,
  Wallet,
  TrendingUp,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import AnimatedNumber from "@/components/shared/animated-number";
import { fmtDuration } from "@/lib/show-types";
import type { LucideIcon } from "lucide-react";

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
  icon: LucideIcon;
  color: string;
  bg: string;
  ring: string;
}

const TILES: TileDef[] = [
  { key: "totalRevenue", label: "Total Revenue", icon: DollarSign, color: "text-[#C9A84C]", bg: "bg-[#C9A84C]/8", ring: "ring-[#C9A84C]/10" },
  { key: "periodRevenue", label: "Period Revenue", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/8", ring: "ring-emerald-500/10" },
  { key: "modelPay", label: "Model Payouts", icon: Wallet, color: "text-purple-400", bg: "bg-purple-500/8", ring: "ring-purple-500/10" },
  { key: "perHour", label: "Avg $/Hour", icon: Zap, color: "text-amber-400", bg: "bg-amber-500/8", ring: "ring-amber-500/10" },
  { key: "totalOnline", label: "Total Stream Time", icon: Clock, color: "text-blue-400", bg: "bg-blue-500/8", ring: "ring-blue-500/10" },
  { key: "publicTime", label: "Free Chat", icon: Eye, color: "text-emerald-400", bg: "bg-emerald-500/8", ring: "ring-emerald-500/10" },
  { key: "privateTime", label: "Private Shows", icon: Lock, color: "text-pink-400", bg: "bg-pink-500/8", ring: "ring-pink-500/10" },
  { key: "groupTime", label: "Group Shows", icon: Users, color: "text-cyan-400", bg: "bg-cyan-500/8", ring: "ring-cyan-500/10" },
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
    (s: number, d: any) =>
      s + (d.free_chat_minutes || d.public_minutes || 0),
    0
  );
  const privateTime =
    streamStats.reduce(
      (s: number, d: any) =>
        s +
        (d.private_chat_minutes || 0) +
        (d.nude_chat_minutes || 0) +
        (d.semiprivate_minutes || 0) +
        (d.vip_chat_minutes || 0) +
        (d.true_private_minutes || 0) +
        (d.paid_chat_minutes || 0),
      0
    ) ||
    streamStats.reduce(
      (s: number, d: any) => s + (d.private_minutes || 0),
      0
    );
  const groupTime =
    streamStats.reduce(
      (s: number, d: any) =>
        s +
        (d.member_chat_minutes || 0) +
        (d.group_chat_minutes || 0) +
        (d.happy_hour_minutes || 0) +
        (d.party_chat_minutes || 0) +
        (d.pre_gold_show_minutes || 0) +
        (d.gold_show_minutes || 0),
      0
    ) ||
    streamStats.reduce(
      (s: number, d: any) => s + (d.group_minutes || 0),
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
          initial={{ opacity: 0, y: 15, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.4,
            delay: i * 0.04,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className={`bg-[#111111] border border-white/[0.04] rounded-xl p-4 hover:border-white/[0.08] transition-all hover:ring-1 ${t.ring}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-7 h-7 ${t.bg} rounded-lg flex items-center justify-center`}
            >
              <t.icon className={`w-3.5 h-3.5 ${t.color}`} />
            </div>
            <span className="text-[10px] text-[#A8A49A]/40 uppercase tracking-wider leading-tight">
              {t.label}
            </span>
          </div>
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
