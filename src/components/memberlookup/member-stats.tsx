"use client";

import { getTokenRate, resolveStatbateSite } from "@/lib/platforms";

function StatTile({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-4">
      <p className="text-[10px] text-[#A8A49A]/40 uppercase tracking-wider mb-2">{label}</p>
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
  const statbateSite = resolveStatbateSite(site) || site.toLowerCase();
  const tokenRate = getTokenRate(statbateSite);
  const allTimeUsd = (allTimeTokens * tokenRate).toFixed(0);
  const lastTipDate = info.last_tip_date ? new Date(info.last_tip_date).toLocaleDateString() : "\u2014";
  const lastTipAmount = info.last_tip_amount || 0;
  const modelsTipped2w = info.models_tipped_2weeks || 0;
  const modelsMessaged2w = info.models_messaged_2weeks || 0;
  const firstTipDate = info.first_tip_date ? new Date(info.first_tip_date).toLocaleDateString() : "\u2014";

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <StatTile
        label={site === "livejasmin" ? "All-Time Credits" : "All-Time Tokens"}
        value={allTimeTokens.toLocaleString()}
        sub={`\u2248 $${Number(allTimeUsd).toLocaleString()}`}
      />
      <StatTile
        label="Last Tip"
        value={`${lastTipAmount} tk`}
        sub={lastTipDate}
      />
      <StatTile
        label="Models Tipped (2w)"
        value={modelsTipped2w}
        sub={`${modelsMessaged2w} messaged`}
      />
      <StatTile
        label="First Tip"
        value={firstTipDate}
      />
      <StatTile
        label="Last Active"
        value={lastTipDate}
      />
    </div>
  );
}
