/**
 * Show type definitions for cam streaming analytics.
 * Single source of truth for show type labels, colors, and field mappings.
 * Ported from Base44 showTypes.jsx, fully typed.
 */

import {
  Eye,
  Lock,
  Users,
  Coffee,
  Clock,
  Play,
  Star,
  Ticket,
  UserCheck,
  Radio,
  Crown,
  Gem,
  Shield,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ShowType } from "@/lib/supabase/types";

export interface ShowTypeConfig {
  label: string;
  color: string;
  bg: string;
  bar: string;
  dot: string;
  icon: LucideIcon;
  chartColor: string;
}

export const SHOW_TYPES: Record<string, ShowTypeConfig> = {
  free_chat: {
    label: "Free Chat",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    bar: "bg-emerald-500",
    dot: "bg-emerald-400",
    icon: Eye,
    chartColor: "#34d399",
  },
  private_chat: {
    label: "Private",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
    bar: "bg-violet-500",
    dot: "bg-violet-400",
    icon: Lock,
    chartColor: "#a78bfa",
  },
  nude_chat: {
    label: "Nude Chat",
    color: "text-pink-400",
    bg: "bg-pink-500/10",
    bar: "bg-pink-500",
    dot: "bg-pink-400",
    icon: Sparkles,
    chartColor: "#f472b6",
  },
  member_chat: {
    label: "Member Chat",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    bar: "bg-blue-500",
    dot: "bg-blue-400",
    icon: UserCheck,
    chartColor: "#60a5fa",
  },
  away: {
    label: "Away",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    bar: "bg-amber-500",
    dot: "bg-amber-400",
    icon: Coffee,
    chartColor: "#fbbf24",
  },
  on_break: {
    label: "On Break",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    bar: "bg-orange-500",
    dot: "bg-orange-400",
    icon: Clock,
    chartColor: "#fb923c",
  },
  group_chat: {
    label: "Group",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    bar: "bg-cyan-500",
    dot: "bg-cyan-400",
    icon: Users,
    chartColor: "#22d3ee",
  },
  semiprivate: {
    label: "Semi-Private",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    bar: "bg-indigo-500",
    dot: "bg-indigo-400",
    icon: Shield,
    chartColor: "#818cf8",
  },
  vip_chat: {
    label: "VIP Chat",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    bar: "bg-yellow-500",
    dot: "bg-yellow-400",
    icon: Crown,
    chartColor: "#facc15",
  },
  happy_hour: {
    label: "Happy Hour",
    color: "text-lime-400",
    bg: "bg-lime-500/10",
    bar: "bg-lime-500",
    dot: "bg-lime-400",
    icon: Zap,
    chartColor: "#a3e635",
  },
  party_chat: {
    label: "Party Chat",
    color: "text-fuchsia-400",
    bg: "bg-fuchsia-500/10",
    bar: "bg-fuchsia-500",
    dot: "bg-fuchsia-400",
    icon: Radio,
    chartColor: "#e879f9",
  },
  pre_gold_show: {
    label: "Pre-Gold",
    color: "text-amber-300",
    bg: "bg-amber-400/10",
    bar: "bg-amber-400",
    dot: "bg-amber-300",
    icon: Star,
    chartColor: "#fcd34d",
  },
  gold_show: {
    label: "Gold Show",
    color: "text-yellow-300",
    bg: "bg-yellow-400/10",
    bar: "bg-yellow-400",
    dot: "bg-yellow-300",
    icon: Gem,
    chartColor: "#fde047",
  },
  true_private: {
    label: "True Private",
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    bar: "bg-purple-500",
    dot: "bg-purple-400",
    icon: Lock,
    chartColor: "#c084fc",
  },
  paid_chat: {
    label: "Paid Chat",
    color: "text-teal-400",
    bg: "bg-teal-500/10",
    bar: "bg-teal-500",
    dot: "bg-teal-400",
    icon: Ticket,
    chartColor: "#2dd4bf",
  },
  offline: {
    label: "Offline",
    color: "text-zinc-500",
    bg: "bg-zinc-500/10",
    bar: "bg-zinc-600",
    dot: "bg-zinc-500",
    icon: Play,
    chartColor: "#71717a",
  },
  unknown: {
    label: "Unknown",
    color: "text-zinc-500",
    bg: "bg-zinc-500/10",
    bar: "bg-zinc-600",
    dot: "bg-zinc-500",
    icon: Play,
    chartColor: "#71717a",
  },
};

/** Get show type config with fallback to 'unknown' */
export function getShowType(type: string): ShowTypeConfig {
  return SHOW_TYPES[type] ?? SHOW_TYPES.unknown;
}

/** Show types that count as "actively streaming" */
export const ONLINE_SHOW_TYPES = new Set<ShowType>([
  "free_chat",
  "private_chat",
  "nude_chat",
  "member_chat",
  "group_chat",
  "semiprivate",
  "vip_chat",
  "happy_hour",
  "party_chat",
  "pre_gold_show",
  "gold_show",
  "true_private",
  "paid_chat",
]);

/** Show types that count as "on break" */
export const BREAK_SHOW_TYPES = new Set<ShowType>(["away", "on_break"]);

/**
 * Maps DailyStreamStats field names to show types.
 * Used for extracting granular breakdowns.
 */
export const GRANULAR_STAT_FIELDS: Record<string, ShowType> = {
  free_chat_minutes: "free_chat",
  private_chat_minutes: "private_chat",
  nude_chat_minutes: "nude_chat",
  member_chat_minutes: "member_chat",
  group_chat_minutes: "group_chat",
  semiprivate_minutes: "semiprivate",
  vip_chat_minutes: "vip_chat",
  happy_hour_minutes: "happy_hour",
  party_chat_minutes: "party_chat",
  pre_gold_show_minutes: "pre_gold_show",
  gold_show_minutes: "gold_show",
  true_private_minutes: "true_private",
  paid_chat_minutes: "paid_chat",
};

/** Extract non-zero minute breakdowns from a daily stats record */
export function getGranularBreakdown(
  stat: Record<string, unknown>
): { type: ShowType; minutes: number; config: ShowTypeConfig }[] {
  return Object.entries(GRANULAR_STAT_FIELDS)
    .map(([field, showType]) => ({
      type: showType,
      minutes: Number(stat[field]) || 0,
      config: getShowType(showType),
    }))
    .filter((entry) => entry.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);
}

/** Format minutes as "Xh Ym" */
export function fmtDuration(mins: number): string {
  if (mins < 1) return "0m";
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
