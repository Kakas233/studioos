"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change: number;
  changeLabel?: string;
  prefix?: string;
}

export default function StatsCard({
  title,
  value,
  change,
  changeLabel,
}: StatsCardProps) {
  const changeNum = parseFloat(String(change)) || 0;
  const isPositive = changeNum > 0;
  const isNeutral = changeNum === 0;

  return (
    <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-3 sm:p-4 min-w-0 hover:border-white/[0.08] transition-colors">
      <p className="text-[10px] sm:text-xs font-medium text-[#A8A49A]/40 tracking-wide truncate mb-1 sm:mb-2">
        {title}
      </p>
      <p className="text-base sm:text-xl font-semibold text-white truncate">
        {value}
      </p>
      <div className="flex items-center gap-1.5 mt-1.5">
        {isNeutral ? (
          <Minus className="w-3 h-3 text-[#A8A49A]/30" />
        ) : isPositive ? (
          <TrendingUp className="w-3 h-3 text-emerald-400" />
        ) : (
          <TrendingDown className="w-3 h-3 text-red-400" />
        )}
        <span
          className={cn(
            "text-xs font-medium",
            isNeutral
              ? "text-[#A8A49A]/30"
              : isPositive
                ? "text-emerald-400"
                : "text-red-400"
          )}
        >
          {changeNum >= 0 ? "+" : ""}
          {changeNum.toFixed(1)}%
        </span>
        {changeLabel && (
          <span className="text-[10px] text-[#A8A49A]/25 ml-0.5 truncate">
            {changeLabel}
          </span>
        )}
      </div>
    </div>
  );
}
