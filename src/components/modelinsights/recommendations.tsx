"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Target,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  Flame,
  AlertTriangle,
  Star,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import type { LucideIcon } from "lucide-react";

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

function buildAnalyticsPayload(earnings: any[], streamStats: any[]) {
  const hasEarnings = earnings.length > 0;

  // --- Site revenue breakdown ---
  const siteRevenues: Record<string, number> = {};
  const siteTokens: Record<string, number> = {};
  SITE_KEYS.forEach((site) => {
    const usd = earnings.reduce(
      (s: number, e: any) => s + (e[`${site}_usd`] || 0),
      0
    );
    const tokens = earnings.reduce(
      (s: number, e: any) => s + (e[`${site}_tokens`] || 0),
      0
    );
    if (usd > 0) siteRevenues[site] = Math.round(usd * 100) / 100;
    if (tokens > 0) siteTokens[site] = tokens;
  });

  const totalGross = earnings.reduce(
    (s: number, e: any) => s + (e.total_gross_usd || 0),
    0
  );
  const totalModelPay = earnings.reduce(
    (s: number, e: any) => s + (e.model_pay_usd || 0),
    0
  );

  // --- Site dominance analysis ---
  const sortedSites = Object.entries(siteRevenues).sort(
    (a, b) => b[1] - a[1]
  );
  const topSiteShare =
    totalGross > 0 && sortedSites.length > 0
      ? (sortedSites[0][1] / totalGross) * 100
      : 0;
  const siteShares: Record<string, number> = {};
  sortedSites.forEach(([site, rev]) => {
    siteShares[site] =
      totalGross > 0
        ? Math.round((rev / totalGross) * 1000) / 10
        : 0;
  });

  // --- Stream time metrics (granular) ---
  const totalFreeChatMins = streamStats.reduce(
    (s: number, d: any) => s + (d.free_chat_minutes || 0),
    0
  );
  const totalPrivateChatMins = streamStats.reduce(
    (s: number, d: any) => s + (d.private_chat_minutes || 0),
    0
  );
  const totalNudeChatMins = streamStats.reduce(
    (s: number, d: any) => s + (d.nude_chat_minutes || 0),
    0
  );
  const totalMemberChatMins = streamStats.reduce(
    (s: number, d: any) => s + (d.member_chat_minutes || 0),
    0
  );
  const totalGroupChatMins = streamStats.reduce(
    (s: number, d: any) => s + (d.group_chat_minutes || 0),
    0
  );
  const totalSemiprivateMins = streamStats.reduce(
    (s: number, d: any) => s + (d.semiprivate_minutes || 0),
    0
  );
  const totalVipChatMins = streamStats.reduce(
    (s: number, d: any) => s + (d.vip_chat_minutes || 0),
    0
  );
  const totalHappyHourMins = streamStats.reduce(
    (s: number, d: any) => s + (d.happy_hour_minutes || 0),
    0
  );
  const totalPartyChatMins = streamStats.reduce(
    (s: number, d: any) => s + (d.party_chat_minutes || 0),
    0
  );
  const totalPreGoldShowMins = streamStats.reduce(
    (s: number, d: any) => s + (d.pre_gold_show_minutes || 0),
    0
  );
  const totalGoldShowMins = streamStats.reduce(
    (s: number, d: any) => s + (d.gold_show_minutes || 0),
    0
  );
  const totalTruePrivateMins = streamStats.reduce(
    (s: number, d: any) => s + (d.true_private_minutes || 0),
    0
  );
  const totalPaidChatMins = streamStats.reduce(
    (s: number, d: any) => s + (d.paid_chat_minutes || 0),
    0
  );
  const totalBreakMins = streamStats.reduce(
    (s: number, d: any) => s + (d.away_minutes || d.break_minutes || 0),
    0
  );
  const totalOnlineMins = streamStats.reduce(
    (s: number, d: any) => s + (d.total_minutes || 0),
    0
  );
  const totalOfflineMins = streamStats.reduce(
    (s: number, d: any) => s + (d.offline_minutes || 0),
    0
  );
  // Legacy aggregate sums
  const totalPublicMins = totalFreeChatMins;
  const totalPrivateMins =
    totalPrivateChatMins +
    totalNudeChatMins +
    totalSemiprivateMins +
    totalVipChatMins +
    totalTruePrivateMins +
    totalPaidChatMins;
  const totalGroupMins =
    totalMemberChatMins +
    totalGroupChatMins +
    totalHappyHourMins +
    totalPartyChatMins +
    totalPreGoldShowMins +
    totalGoldShowMins;

  // --- Day-of-week patterns ---
  const dowLabels = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const dowStats: Record<
    number,
    {
      label: string;
      totalMins: number;
      privateMins: number;
      publicMins: number;
      groupMins: number;
      days: number;
      earnings: number;
      dates: string[];
    }
  > = {};
  streamStats.forEach((stat: any) => {
    if (!stat.date) return;
    const dow = new Date(stat.date + "T12:00:00").getDay();
    if (!dowStats[dow])
      dowStats[dow] = {
        label: dowLabels[dow],
        totalMins: 0,
        privateMins: 0,
        publicMins: 0,
        groupMins: 0,
        days: 0,
        earnings: 0,
        dates: [],
      };
    dowStats[dow].totalMins += stat.total_minutes || 0;
    dowStats[dow].privateMins +=
      (stat.private_chat_minutes || 0) +
      (stat.nude_chat_minutes || 0) +
      (stat.semiprivate_minutes || 0) +
      (stat.vip_chat_minutes || 0) +
      (stat.true_private_minutes || 0) +
      (stat.paid_chat_minutes || 0);
    dowStats[dow].publicMins += stat.free_chat_minutes || 0;
    dowStats[dow].groupMins +=
      (stat.member_chat_minutes || 0) +
      (stat.group_chat_minutes || 0) +
      (stat.happy_hour_minutes || 0) +
      (stat.party_chat_minutes || 0) +
      (stat.pre_gold_show_minutes || 0) +
      (stat.gold_show_minutes || 0);
    dowStats[dow].days += 1;
    if (!dowStats[dow].dates.includes(stat.date))
      dowStats[dow].dates.push(stat.date);
  });
  earnings.forEach((e: any) => {
    if (!e.shift_date) return;
    const dow = new Date(e.shift_date + "T12:00:00").getDay();
    if (dowStats[dow]) dowStats[dow].earnings += e.total_gross_usd || 0;
  });

  // --- Schedule consistency ---
  const allDates = [
    ...new Set(streamStats.map((s: any) => s.date).filter(Boolean)),
  ].sort();
  const totalWeeksSpan =
    allDates.length > 1
      ? Math.max(
          1,
          Math.ceil(
            (new Date(allDates[allDates.length - 1]).getTime() -
              new Date(allDates[0]).getTime()) /
              (7 * 86400000)
          )
        )
      : 1;

  const scheduleConsistency: Record<
    string,
    { streamed_count: number; out_of_weeks: number; regularity_pct: number }
  > = {};
  Object.entries(dowStats).forEach(([, data]) => {
    const uniqueDays = data.dates.length;
    scheduleConsistency[data.label] = {
      streamed_count: uniqueDays,
      out_of_weeks: totalWeeksSpan,
      regularity_pct: Math.round((uniqueDays / totalWeeksSpan) * 100),
    };
  });

  // --- Per-day-of-week private show performance ---
  const bestPrivateDays = Object.values(dowStats)
    .map((d) => ({
      day: d.label,
      avgPrivateMinsPerSession:
        d.days > 0 ? Math.round(d.privateMins / d.days) : 0,
      avgEarningsPerDay:
        d.days > 0
          ? Math.round((d.earnings / d.days) * 100) / 100
          : 0,
      totalPrivateMins: Math.round(d.privateMins),
    }))
    .sort((a, b) => b.avgPrivateMinsPerSession - a.avgPrivateMinsPerSession);

  // --- Daily stream patterns ---
  const dailyHours: Record<string, number> = {};
  streamStats.forEach((stat: any) => {
    if (!stat.date) return;
    dailyHours[stat.date] =
      (dailyHours[stat.date] || 0) + (stat.total_minutes || 0) / 60;
  });
  const daysStreamed = Object.keys(dailyHours).length;

  // --- Revenue per site per hour ---
  const siteEfficiency: Record<string, number> = {};
  if (hasEarnings && totalOnlineMins > 0) {
    SITE_KEYS.forEach((site) => {
      const siteUsd = siteRevenues[site] || 0;
      if (siteUsd > 0) {
        siteEfficiency[site] =
          Math.round((siteUsd / (totalOnlineMins / 60)) * 100) / 100;
      }
    });
  }

  // --- $/hour ---
  const totalHours = totalOnlineMins / 60;
  const overallDollarPerHour =
    totalHours > 0 && hasEarnings ? totalGross / totalHours : null;

  // --- Earning trend ---
  let earningTrend: {
    first_half_revenue: number;
    second_half_revenue: number;
    direction: string;
  } | null = null;
  if (hasEarnings) {
    const sorted = [...earnings].sort((a: any, b: any) =>
      (a.shift_date || "").localeCompare(b.shift_date || "")
    );
    const mid = Math.floor(sorted.length / 2);
    const firstHalfTotal = sorted
      .slice(0, mid)
      .reduce((s: number, e: any) => s + (e.total_gross_usd || 0), 0);
    const secondHalfTotal = sorted
      .slice(mid)
      .reduce((s: number, e: any) => s + (e.total_gross_usd || 0), 0);
    earningTrend = {
      first_half_revenue: Math.round(firstHalfTotal * 100) / 100,
      second_half_revenue: Math.round(secondHalfTotal * 100) / 100,
      direction:
        secondHalfTotal > firstHalfTotal * 1.05
          ? "improving"
          : secondHalfTotal < firstHalfTotal * 0.95
            ? "declining"
            : "stable",
    };
  }

  // --- DETERMINISTIC PERFORMANCE SCORE ---
  const scoreBreakdown: Record<string, number> = {};
  let calculatedScore = 0;

  // 1. Schedule consistency (0-25 pts)
  const regularityValues = Object.values(scheduleConsistency).map(
    (d) => d.regularity_pct
  );
  const avgRegularity =
    regularityValues.length > 0
      ? regularityValues.reduce((a, b) => a + b, 0) /
        regularityValues.length
      : 0;
  const daysWithStreaming = Object.keys(dowStats).length;
  const consistencyScore = Math.min(
    25,
    Math.round(
      (Math.min(avgRegularity, 100) / 100) * 15 +
        (Math.min(daysWithStreaming, 5) / 5) * 10
    )
  );
  scoreBreakdown.schedule_consistency = consistencyScore;

  // 2. Private show ratio (0-25 pts)
  const privateRatio =
    totalOnlineMins > 0 ? (totalPrivateMins / totalOnlineMins) * 100 : 0;
  let privateScore = 0;
  if (privateRatio >= 25 && privateRatio <= 40) privateScore = 25;
  else if (privateRatio >= 15 && privateRatio < 25)
    privateScore = Math.round(15 + ((privateRatio - 15) / 10) * 10);
  else if (privateRatio > 40 && privateRatio <= 60)
    privateScore = Math.round(25 - ((privateRatio - 40) / 20) * 5);
  else if (privateRatio > 60) privateScore = 15;
  else if (privateRatio > 0)
    privateScore = Math.round((privateRatio / 15) * 10);
  else privateScore = 0;
  scoreBreakdown.private_ratio = privateScore;

  // 3. Streaming volume (0-20 pts)
  const weeklyHours =
    totalWeeksSpan > 0 ? totalHours / totalWeeksSpan : 0;
  let volumeScore = 0;
  if (weeklyHours >= 20 && weeklyHours <= 35) volumeScore = 20;
  else if (weeklyHours >= 10 && weeklyHours < 20)
    volumeScore = Math.round(10 + ((weeklyHours - 10) / 10) * 10);
  else if (weeklyHours > 35 && weeklyHours <= 50)
    volumeScore = Math.round(20 - ((weeklyHours - 35) / 15) * 5);
  else if (weeklyHours > 50) volumeScore = 12;
  else if (weeklyHours > 0)
    volumeScore = Math.round((weeklyHours / 10) * 8);
  scoreBreakdown.streaming_volume = volumeScore;

  // 4. Revenue efficiency (0-20 pts)
  let efficiencyScore = 0;
  if (hasEarnings && overallDollarPerHour !== null) {
    if (overallDollarPerHour >= 100) efficiencyScore = 20;
    else if (overallDollarPerHour >= 50)
      efficiencyScore = Math.round(
        15 + ((overallDollarPerHour - 50) / 50) * 5
      );
    else if (overallDollarPerHour >= 25)
      efficiencyScore = Math.round(
        10 + ((overallDollarPerHour - 25) / 25) * 5
      );
    else if (overallDollarPerHour > 0)
      efficiencyScore = Math.round((overallDollarPerHour / 25) * 10);
    scoreBreakdown.revenue_efficiency = efficiencyScore;
  }

  // 5. Earning trend (0-10 pts)
  let trendScore = 0;
  if (hasEarnings && earningTrend) {
    if (earningTrend.direction === "improving") trendScore = 10;
    else if (earningTrend.direction === "stable") trendScore = 6;
    else trendScore = 2;
    scoreBreakdown.earning_trend = trendScore;
  }

  // Calculate total
  const maxPossible = 25 + 25 + 20 + (hasEarnings ? 20 + 10 : 0);
  const rawScore =
    consistencyScore +
    privateScore +
    volumeScore +
    efficiencyScore +
    trendScore;
  calculatedScore = Math.round((rawScore / maxPossible) * 100);
  calculatedScore = Math.max(0, Math.min(100, calculatedScore));

  return {
    data_context: {
      has_earnings_data: hasEarnings,
      earnings_count: earnings.length,
      stream_days_count: daysStreamed,
      total_weeks_span: totalWeeksSpan,
      note: hasEarnings
        ? "Earnings data available -- full analysis possible."
        : "NO EARNINGS DATA YET -- this is a newly added model with only historical stream data from scraping. Earnings are entered manually when shifts are completed. Focus analysis on streaming patterns, schedule optimization, and show type mix ONLY. Do NOT comment on revenue, $/hour, or earnings trends.",
    },
    performance_score: {
      total: calculatedScore,
      breakdown: scoreBreakdown,
      max_possible: maxPossible,
      note: "This score is pre-calculated from the data. Use this exact score in your response. Do NOT invent a different score.",
    },
    ...(hasEarnings
      ? {
          revenue: {
            total_gross_usd: Math.round(totalGross * 100) / 100,
            total_model_pay_usd: Math.round(totalModelPay * 100) / 100,
            revenue_by_site: siteRevenues,
            site_revenue_shares_pct: siteShares,
            top_site_share_pct: Math.round(topSiteShare * 10) / 10,
            tokens_by_site: siteTokens,
            dollar_per_hour: overallDollarPerHour
              ? Math.round(overallDollarPerHour * 100) / 100
              : null,
            site_efficiency_dollar_per_hour: siteEfficiency,
          },
          earning_trend: earningTrend,
        }
      : {}),
    stream_time: {
      total_online_hours: Math.round(totalHours * 10) / 10,
      free_chat_hours:
        Math.round((totalFreeChatMins / 60) * 10) / 10,
      private_chat_hours:
        Math.round((totalPrivateChatMins / 60) * 10) / 10,
      nude_chat_hours:
        Math.round((totalNudeChatMins / 60) * 10) / 10,
      member_chat_hours:
        Math.round((totalMemberChatMins / 60) * 10) / 10,
      group_chat_hours:
        Math.round((totalGroupChatMins / 60) * 10) / 10,
      semiprivate_hours:
        Math.round((totalSemiprivateMins / 60) * 10) / 10,
      vip_chat_hours:
        Math.round((totalVipChatMins / 60) * 10) / 10,
      happy_hour_hours:
        Math.round((totalHappyHourMins / 60) * 10) / 10,
      party_chat_hours:
        Math.round((totalPartyChatMins / 60) * 10) / 10,
      pre_gold_show_hours:
        Math.round((totalPreGoldShowMins / 60) * 10) / 10,
      gold_show_hours:
        Math.round((totalGoldShowMins / 60) * 10) / 10,
      true_private_hours:
        Math.round((totalTruePrivateMins / 60) * 10) / 10,
      paid_chat_hours:
        Math.round((totalPaidChatMins / 60) * 10) / 10,
      break_hours: Math.round((totalBreakMins / 60) * 10) / 10,
      offline_hours: Math.round((totalOfflineMins / 60) * 10) / 10,
      total_public_hours:
        Math.round((totalPublicMins / 60) * 10) / 10,
      total_private_hours:
        Math.round((totalPrivateMins / 60) * 10) / 10,
      total_group_hours:
        Math.round((totalGroupMins / 60) * 10) / 10,
      private_ratio_pct:
        totalOnlineMins > 0
          ? Math.round((totalPrivateMins / totalOnlineMins) * 1000) / 10
          : 0,
      public_ratio_pct:
        totalOnlineMins > 0
          ? Math.round((totalPublicMins / totalOnlineMins) * 1000) / 10
          : 0,
    },
    schedule_analysis: {
      days_streamed: daysStreamed,
      schedule_regularity: scheduleConsistency,
      best_days_for_private_shows: bestPrivateDays,
      day_of_week_performance: Object.values(dowStats).map((d) => ({
        day: d.label,
        total_stream_mins: Math.round(d.totalMins),
        private_mins: Math.round(d.privateMins),
        public_mins: Math.round(d.publicMins),
        group_mins: Math.round(d.groupMins),
        sessions_count: d.days,
        ...(hasEarnings
          ? {
              earnings: Math.round(d.earnings * 100) / 100,
              avg_earnings_per_day:
                d.days > 0
                  ? Math.round((d.earnings / d.days) * 100) / 100
                  : 0,
            }
          : {}),
        avg_hours_per_day:
          d.days > 0
            ? Math.round((d.totalMins / d.days / 60) * 10) / 10
            : 0,
        private_ratio_pct:
          d.totalMins > 0
            ? Math.round((d.privateMins / d.totalMins) * 1000) / 10
            : 0,
      })),
    },
  };
}

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  revenue_optimization: DollarSign,
  schedule_optimization: Clock,
  platform_strategy: Target,
  show_type_strategy: Flame,
  consistency: TrendingUp,
  growth_opportunity: Star,
  risk_alert: AlertTriangle,
  engagement: Users,
  efficiency: Zap,
};

const CATEGORY_COLORS: Record<
  string,
  { color: string; bg: string; border: string }
> = {
  revenue_optimization: {
    color: "text-[#C9A84C]",
    bg: "bg-[#C9A84C]/8",
    border: "border-[#C9A84C]/15",
  },
  schedule_optimization: {
    color: "text-blue-400",
    bg: "bg-blue-500/8",
    border: "border-blue-500/15",
  },
  platform_strategy: {
    color: "text-emerald-400",
    bg: "bg-emerald-500/8",
    border: "border-emerald-500/15",
  },
  show_type_strategy: {
    color: "text-pink-400",
    bg: "bg-pink-500/8",
    border: "border-pink-500/15",
  },
  consistency: {
    color: "text-purple-400",
    bg: "bg-purple-500/8",
    border: "border-purple-500/15",
  },
  growth_opportunity: {
    color: "text-amber-400",
    bg: "bg-amber-500/8",
    border: "border-amber-500/15",
  },
  risk_alert: {
    color: "text-red-400",
    bg: "bg-red-500/8",
    border: "border-red-500/15",
  },
  engagement: {
    color: "text-cyan-400",
    bg: "bg-cyan-500/8",
    border: "border-cyan-500/15",
  },
  efficiency: {
    color: "text-orange-400",
    bg: "bg-orange-500/8",
    border: "border-orange-500/15",
  },
};

const PRIORITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};
const PRIORITY_BADGES: Record<string, string> = {
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
  high: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  low: "bg-white/[0.04] text-[#A8A49A]/50 border-white/[0.06]",
};

interface RecommendationsProps {
  earnings: any[];
  streamStats: any[];
  selectedModel: string;
}

export default function Recommendations({
  earnings,
  streamStats,
  selectedModel,
}: RecommendationsProps) {
  const [recommendations, setRecommendations] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const analyticsPayload = useMemo(
    () => buildAnalyticsPayload(earnings, streamStats),
    [earnings, streamStats]
  );

  const hasEnoughData = streamStats.length >= 3;

  const generateRecommendations = async () => {
    setLoading(true);
    setError(null);

    const hasEarnings = analyticsPayload.data_context.has_earnings_data;

    const prompt = `You are an expert performance coach for the adult webcam / cam studio industry. You work inside a studio management platform. The studio manager will use your recommendations to coach their model.

CRITICAL CONTEXT ABOUT THE DATA:
- Stream data (public/private/group minutes, schedule patterns) comes from automated scraping of cam platforms.
- Earnings data is MANUALLY entered by operators after shifts are completed. It is NOT automatically linked to stream data.
- ${
      hasEarnings
        ? "This model HAS earnings data recorded. You can analyze revenue alongside streaming patterns."
        : "This model has NO earnings data yet. This means the model was JUST added to the system and only has historical stream data from scraping. DO NOT mention revenue, $/hour, earnings trends, or anything money-related. Focus EXCLUSIVELY on streaming patterns, schedule, show types, and platform-specific tips."
    }

PERFORMANCE DATA:
${JSON.stringify(analyticsPayload, null, 2)}

YOUR ANALYSIS FRAMEWORK (only cover areas where data exists):

---

**1. SCHEDULE & CONSISTENCY ANALYSIS** (ALWAYS analyze this)
- Look at "schedule_regularity" -- which days does the model consistently stream? Regularity % shows how often they stream on each day out of total weeks.
- Consistency means streaming during the SAME DAYS and SAME TIME SLOTS regularly, NOT just streaming many hours.
- Identify their best performing days and recommend building a regular weekly schedule around those days.
- Recommend specific days and time windows. Peak cam traffic is Thu-Sun evenings (18:00-02:00 CET/local).

---

**2. SHOW TYPE STRATEGY** (analyze from stream time data)
- Look at private_ratio_pct. Industry benchmark: top earners have 25-40% private time.
- Give specific TACTICS per platform, not just "do more privates."

---

${
  hasEarnings
    ? `**3. PLATFORM STRATEGY** (analyze from revenue data)
- Calculate each site's share of total revenue.
- Give PLATFORM-SPECIFIC improvement tips for underperforming sites.

---

**4. REVENUE EFFICIENCY** (only if earnings data exists)
- Analyze dollar_per_hour rate. Benchmarks: $15-25/hr = below average, $25-50/hr = average, $50-100/hr = good, $100+/hr = excellent.

---

**5. EARNING TREND** (only if earnings data exists)
- If declining: flag urgently.
- If improving: reinforce what's working.
- If stable: suggest growth experiments.`
    : ""
}

---

PERFORMANCE SCORE:
The performance score has been pre-calculated from the data: ${analyticsPayload.performance_score.total}/100
Breakdown: ${JSON.stringify(analyticsPayload.performance_score.breakdown)}
You MUST use this exact score (${analyticsPayload.performance_score.total}) in your overall_score response. Do NOT calculate or invent a different score.

IMPORTANT RULES:
- Be direct and professional. No fluff, no generic advice.
- NEVER say "just do more privates" or "stream more hours" without specific tactical advice on HOW.
- Use actual numbers from the data.
- Give platform-specific tips.
- ${hasEarnings ? "Prioritize by revenue impact." : "Focus on building a strong streaming foundation."}
- DO NOT reference the absence of earnings as a problem.
- Keep recommendations practical.`;

    const schema = {
      type: "object",
      properties: {
        overall_score: {
          type: "number",
          description: "Performance score 0-100.",
        },
        overall_assessment: {
          type: "string",
          description: "2-3 sentence summary.",
        },
        recommended_weekly_schedule: {
          type: "object",
          description: "Suggested optimal weekly schedule",
          properties: {
            days: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: {
                    type: "string",
                    enum: [
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                      "Sunday",
                    ],
                  },
                  recommended: { type: "boolean" },
                  suggested_hours: { type: "string" },
                  reason: { type: "string" },
                },
                required: [
                  "day",
                  "recommended",
                  "suggested_hours",
                  "reason",
                ],
              },
            },
            total_recommended_hours: { type: "number" },
            schedule_note: { type: "string" },
          },
          required: [
            "days",
            "total_recommended_hours",
            "schedule_note",
          ],
        },
        recommendations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              category: {
                type: "string",
                enum: [
                  "revenue_optimization",
                  "schedule_optimization",
                  "platform_strategy",
                  "show_type_strategy",
                  "consistency",
                  "growth_opportunity",
                  "risk_alert",
                  "engagement",
                  "efficiency",
                ],
              },
              priority: {
                type: "string",
                enum: ["critical", "high", "medium", "low"],
              },
              title: { type: "string" },
              summary: { type: "string" },
              detailed_analysis: { type: "string" },
              action_items: {
                type: "array",
                items: { type: "string" },
              },
              estimated_impact: { type: "string" },
            },
            required: [
              "category",
              "priority",
              "title",
              "summary",
              "detailed_analysis",
              "action_items",
              "estimated_impact",
            ],
          },
        },
      },
      required: [
        "overall_score",
        "overall_assessment",
        "recommended_weekly_schedule",
        "recommendations",
      ],
    };

    try {
      const response = await fetch("/api/ai/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          response_json_schema: schema,
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const result = await response.json();
      // Override AI score with our deterministic one
      result.overall_score = analyticsPayload.performance_score.total;
      result._score_breakdown =
        analyticsPayload.performance_score.breakdown;
      setRecommendations(result);
      setHasGenerated(true);
    } catch (err) {
      console.error("AI recommendation error:", err);
      setError(
        "Failed to generate recommendations. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate on first load with sufficient data
  useEffect(() => {
    if (hasEnoughData && !hasGenerated && !loading) {
      generateRecommendations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasEnoughData]);

  const sortedRecs = useMemo(() => {
    if (!recommendations?.recommendations) return [];
    return [...recommendations.recommendations].sort(
      (a: any, b: any) =>
        (PRIORITY_ORDER[a.priority] ?? 3) -
        (PRIORITY_ORDER[b.priority] ?? 3)
    );
  }, [recommendations]);

  if (!selectedModel || selectedModel === "all") {
    return (
      <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-[#C9A84C]" />
          <p className="text-xs text-[#A8A49A]/40 font-medium tracking-wide">
            AI Performance Coach
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 bg-white/[0.03] rounded-xl flex items-center justify-center mb-3">
            <Users className="w-5 h-5 text-[#A8A49A]/20" />
          </div>
          <p className="text-sm text-[#A8A49A]/40 mb-1">
            Select a Model
          </p>
          <p className="text-xs text-[#A8A49A]/25 max-w-sm">
            Choose a specific model from the filters above to see
            personalized AI performance coaching and recommendations.
          </p>
        </div>
      </div>
    );
  }

  if (!hasEnoughData) {
    return (
      <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-[#C9A84C]" />
          <p className="text-xs text-[#A8A49A]/40 font-medium tracking-wide">
            AI Performance Coach
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-12 h-12 bg-white/[0.03] rounded-xl flex items-center justify-center mb-3">
            <Sparkles className="w-5 h-5 text-[#A8A49A]/20" />
          </div>
          <p className="text-sm text-[#A8A49A]/40 mb-1">
            Need More Data
          </p>
          <p className="text-xs text-[#A8A49A]/25 max-w-sm">
            At least 3 days of stream data are needed to unlock
            AI-powered performance analysis. Connect a cam account to
            start fetching data automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#C9A84C]" />
          <p className="text-xs text-[#A8A49A]/40 font-medium tracking-wide">
            AI Performance Coach
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={generateRecommendations}
          disabled={loading}
          className="text-[#A8A49A]/40 hover:text-[#C9A84C] h-7 px-2 text-xs"
        >
          <RefreshCw
            className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`}
          />
          {loading ? "Analyzing..." : "Refresh"}
        </Button>
      </div>

      {/* Loading state */}
      {loading && !recommendations && (
        <div className="flex flex-col items-center py-10">
          <div className="relative mb-4">
            <div className="w-14 h-14 border-2 border-[#C9A84C]/20 rounded-full" />
            <div className="absolute inset-0 w-14 h-14 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
            <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-[#C9A84C] animate-pulse" />
          </div>
          <p className="text-sm text-white/60 mb-1">
            Analyzing performance data...
          </p>
          <p className="text-xs text-[#A8A49A]/30">
            Deep-diving into revenue patterns, schedules, and platform
            metrics
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-500/8 border border-red-500/15 rounded-lg mb-3">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      {recommendations && (
        <div className="space-y-4">
          {/* Overall Score */}
          <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
            <div className="flex items-start gap-4 mb-3">
              <div className="relative shrink-0">
                <svg
                  width="56"
                  height="56"
                  viewBox="0 0 56 56"
                  className="transform -rotate-90"
                >
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth="4"
                  />
                  <circle
                    cx="28"
                    cy="28"
                    r="24"
                    fill="none"
                    stroke={
                      recommendations.overall_score >= 70
                        ? "#10B981"
                        : recommendations.overall_score >= 40
                          ? "#F59E0B"
                          : "#EF4444"
                    }
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={`${(recommendations.overall_score / 100) * 150.8} 150.8`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                  {recommendations.overall_score}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs font-medium text-white">
                    Performance Score
                  </p>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                      recommendations.overall_score >= 70
                        ? "bg-emerald-500/15 text-emerald-400"
                        : recommendations.overall_score >= 40
                          ? "bg-amber-500/15 text-amber-400"
                          : "bg-red-500/15 text-red-400"
                    }`}
                  >
                    {recommendations.overall_score >= 70
                      ? "Strong"
                      : recommendations.overall_score >= 40
                        ? "Average"
                        : "Needs Work"}
                  </span>
                </div>
                <p className="text-xs text-[#A8A49A]/50 leading-relaxed">
                  {recommendations.overall_assessment}
                </p>
              </div>
            </div>
            {/* Score Breakdown Bars */}
            {recommendations._score_breakdown && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-3 border-t border-white/[0.04]">
                {[
                  {
                    key: "schedule_consistency",
                    label: "Schedule",
                    max: 25,
                    color: "#3B82F6",
                  },
                  {
                    key: "private_ratio",
                    label: "Private Mix",
                    max: 25,
                    color: "#EC4899",
                  },
                  {
                    key: "streaming_volume",
                    label: "Volume",
                    max: 20,
                    color: "#C9A84C",
                  },
                  {
                    key: "revenue_efficiency",
                    label: "$/Hour",
                    max: 20,
                    color: "#10B981",
                  },
                  {
                    key: "earning_trend",
                    label: "Trend",
                    max: 10,
                    color: "#8B5CF6",
                  },
                ]
                  .filter(
                    (d) =>
                      recommendations._score_breakdown[d.key] !==
                      undefined
                  )
                  .map((d) => {
                    const val =
                      recommendations._score_breakdown[d.key];
                    const pct = Math.round(
                      (val / d.max) * 100
                    );
                    return (
                      <div key={d.key} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] text-[#A8A49A]/40">
                            {d.label}
                          </span>
                          <span className="text-[9px] text-white/60 font-medium">
                            {val}/{d.max}
                          </span>
                        </div>
                        <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: d.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Recommended Weekly Schedule */}
          {recommendations.recommended_weekly_schedule && (
            <div className="p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-blue-400" />
                <p className="text-xs font-medium text-white">
                  Recommended Weekly Schedule
                </p>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                  {
                    recommendations.recommended_weekly_schedule
                      .total_recommended_hours
                  }
                  h/week
                </span>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-3">
                {recommendations.recommended_weekly_schedule.days?.map(
                  (d: any, i: number) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg text-center border transition-all ${
                        d.recommended
                          ? "bg-[#C9A84C]/8 border-[#C9A84C]/20"
                          : "bg-white/[0.01] border-white/[0.03]"
                      }`}
                      title={d.reason}
                    >
                      <p
                        className={`text-[10px] font-medium mb-0.5 ${
                          d.recommended
                            ? "text-[#C9A84C]"
                            : "text-[#A8A49A]/30"
                        }`}
                      >
                        {d.day?.slice(0, 3)}
                      </p>
                      <p
                        className={`text-[9px] leading-tight ${
                          d.recommended
                            ? "text-[#A8A49A]/50"
                            : "text-[#A8A49A]/20"
                        }`}
                      >
                        {d.suggested_hours}
                      </p>
                    </div>
                  )
                )}
              </div>
              {recommendations.recommended_weekly_schedule
                .schedule_note && (
                <p className="text-[10px] text-[#A8A49A]/35 leading-relaxed italic">
                  {
                    recommendations.recommended_weekly_schedule
                      .schedule_note
                  }
                </p>
              )}
            </div>
          )}

          {/* Recommendation Cards */}
          <div className="space-y-2">
            {sortedRecs.map((rec: any, i: number) => {
              const catStyle =
                CATEGORY_COLORS[rec.category] ||
                CATEGORY_COLORS.revenue_optimization;
              const Icon =
                CATEGORY_ICONS[rec.category] || Sparkles;
              const isExpanded = expandedIdx === i;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`border rounded-xl overflow-hidden transition-colors ${
                    isExpanded
                      ? `${catStyle.border} bg-white/[0.02]`
                      : "border-white/[0.04] bg-white/[0.01]"
                  }`}
                >
                  <button
                    onClick={() =>
                      setExpandedIdx(isExpanded ? null : i)
                    }
                    className="w-full flex items-start gap-3 p-3.5 text-left hover:bg-white/[0.015] transition-colors"
                  >
                    <div
                      className={`w-8 h-8 ${catStyle.bg} rounded-lg flex items-center justify-center shrink-0 mt-0.5`}
                    >
                      <Icon
                        className={`w-4 h-4 ${catStyle.color}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-sm text-white font-medium">
                          {rec.title}
                        </p>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${
                            PRIORITY_BADGES[rec.priority] ||
                            PRIORITY_BADGES.medium
                          }`}
                        >
                          {rec.priority}
                        </span>
                        {rec.estimated_impact && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                            {rec.estimated_impact}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#A8A49A]/45 leading-relaxed">
                        {rec.summary}
                      </p>
                    </div>
                    <div className="shrink-0 mt-1">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[#A8A49A]/30" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#A8A49A]/30" />
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                          height: "auto",
                          opacity: 1,
                        }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3.5 pb-3.5 pl-[3.25rem] space-y-3">
                          <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                            <p className="text-[10px] uppercase tracking-wider text-[#A8A49A]/30 mb-1.5 font-medium">
                              Analysis
                            </p>
                            <p className="text-xs text-[#A8A49A]/60 leading-relaxed">
                              {rec.detailed_analysis}
                            </p>
                          </div>

                          {rec.action_items?.length > 0 && (
                            <div className="p-3 bg-white/[0.02] rounded-lg border border-white/[0.04]">
                              <p className="text-[10px] uppercase tracking-wider text-[#A8A49A]/30 mb-2 font-medium">
                                Action Items
                              </p>
                              <div className="space-y-1.5">
                                {rec.action_items.map(
                                  (
                                    item: string,
                                    j: number
                                  ) => (
                                    <div
                                      key={j}
                                      className="flex items-start gap-2"
                                    >
                                      <div
                                        className={`w-1.5 h-1.5 rounded-full ${catStyle.bg} mt-1.5 shrink-0`}
                                      >
                                        <div
                                          className={`w-1.5 h-1.5 rounded-full ${catStyle.color.replace("text-", "bg-")}`}
                                        />
                                      </div>
                                      <p className="text-xs text-[#A8A49A]/55 leading-relaxed">
                                        {item}
                                      </p>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {loading && (
            <div className="flex items-center justify-center gap-2 py-2">
              <RefreshCw className="w-3 h-3 text-[#C9A84C] animate-spin" />
              <p className="text-xs text-[#A8A49A]/30">
                Refreshing analysis...
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
