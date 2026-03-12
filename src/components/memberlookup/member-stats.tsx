"use client";

import { DollarSign, TrendingUp, Heart, Clock, MessageSquare } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}

function StatTile({ icon: Icon, label, value, sub, color }: StatTileProps) {
  return (
    <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-[10px] text-[#A8A49A]/40 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-semibold text-white">{value}</p>
      {sub && <p className="text-[10px] text-[#A8A49A]/30 mt-1">{sub}</p>}
    </div>
  );
}

interface MemberStatsProps {
  info: any;
}

export default function MemberStats({ info }: MemberStatsProps) {
  if (!info) return null;

  const allTimeTokens = info.all_time_tokens || 0;
  const site = info.site || "";
  const SITE_TOKEN_RATES: Record<string, number> = {
    livejasmin: 1.0, bongacams: 0.02, cam4: 0.1, flirt4free: 0.03,
    myfreecams: 0.05, chaturbate: 0.05, stripchat: 0.05, camsoda: 0.05,
  };
  const tokenRate = SITE_TOKEN_RATES[site.toLowerCase()] ?? 0.05;
  const allTimeUsd = (allTimeTokens * tokenRate).toFixed(0);
  const lastTipDate = info.last_tip_date ? new Date(info.last_tip_date).toLocaleDateString() : "\u2014";
  const lastTipAmount = info.last_tip_amount || 0;
  const modelsTipped2w = info.models_tipped_2weeks || 0;
  const modelsMessaged2w = info.models_messaged_2weeks || 0;
  const firstTipDate = info.first_tip_date ? new Date(info.first_tip_date).toLocaleDateString() : "\u2014";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <StatTile
        icon={DollarSign}
        label={site === "livejasmin" ? "All-Time Credits" : "All-Time Tokens"}
        value={allTimeTokens.toLocaleString()}
        sub={`\u2248 $${Number(allTimeUsd).toLocaleString()}`}
        color="text-[#C9A84C]"
      />
      <StatTile
        icon={TrendingUp}
        label="Last Tip"
        value={`${lastTipAmount} tk`}
        sub={lastTipDate}
        color="text-emerald-400"
      />
      <StatTile
        icon={Heart}
        label="Models Tipped (2w)"
        value={modelsTipped2w}
        sub={`${modelsMessaged2w} messaged`}
        color="text-pink-400"
      />
      <StatTile
        icon={MessageSquare}
        label="First Tip"
        value={firstTipDate}
        color="text-blue-400"
      />
      <StatTile
        icon={Clock}
        label="Last Active"
        value={lastTipDate}
        color="text-purple-400"
      />
    </div>
  );
}
