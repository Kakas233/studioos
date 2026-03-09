"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedNumber from "@/components/shared/animated-number";

interface StatsCardProps {
  title: string;
  value: string | number;
  change: number;
  changeLabel?: string;
  prefix?: string;
}

export default function StatsCard({ title, value, change, changeLabel, prefix = "" }: StatsCardProps) {
  const changeNum = parseFloat(String(change)) || 0;
  const isPositive = changeNum > 0;
  const isNeutral = changeNum === 0;

  // Check if value is numeric for animation
  const numericVal = typeof value === "number" ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ""));
  const isNumeric = !isNaN(numericVal) && typeof value !== "string";

  // Detect format from value
  const isCurrency = typeof value === "string" && value.startsWith("$");
  const currencyNum = isCurrency ? parseFloat(String(value).replace(/[^0-9.-]/g, "")) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="bg-[#111111] border border-white/[0.04] rounded-xl p-3 sm:p-4 min-w-0 hover:border-white/[0.08] transition-colors"
    >
      <p className="text-[10px] sm:text-xs font-medium text-[#A8A49A]/40 tracking-wide truncate mb-1 sm:mb-2">{title}</p>
      <p className="text-base sm:text-xl font-semibold text-white truncate">
        {isCurrency ? (
          <>$<AnimatedNumber value={currencyNum} formatter={(v) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v)} /></>
        ) : isNumeric ? (
          <>{prefix}<AnimatedNumber value={numericVal} /></>
        ) : (
          <>{prefix}{value}</>
        )}
      </p>
      <div className="flex items-center gap-1.5 mt-1.5">
        {isNeutral ? (
          <Minus className="w-3 h-3 text-[#A8A49A]/30" />
        ) : isPositive ? (
          <TrendingUp className="w-3 h-3 text-emerald-400" />
        ) : (
          <TrendingDown className="w-3 h-3 text-red-400" />
        )}
        <span className={cn(
          "text-xs font-medium",
          isNeutral ? "text-[#A8A49A]/30" : isPositive ? "text-emerald-400" : "text-red-400"
        )}>
          {changeNum >= 0 ? "+" : ""}{changeNum.toFixed(1)}%
        </span>
        {changeLabel && (
          <span className="text-[10px] text-[#A8A49A]/25 ml-0.5 truncate">{changeLabel}</span>
        )}
      </div>
    </motion.div>
  );
}
