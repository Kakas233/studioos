"use client";

import { BarChart3, Monitor, Clock, CircleDollarSign, Users, MessageSquare, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const TABS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "stats", label: "Stats", icon: BarChart3 },
  { id: "sessions", label: "Sessions", icon: Monitor },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "tips", label: "Tips", icon: CircleDollarSign },
  { id: "top-members", label: "Top Members", icon: Users },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "profile", label: "Profile", icon: User },
];

interface ModelLookupTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function ModelLookupTabs({ activeTab, onTabChange }: ModelLookupTabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1">
      {TABS.map((t) => {
        const active = activeTab === t.id;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
              active
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                : "text-[#A8A49A]/50 hover:text-white hover:bg-white/[0.04] border border-transparent"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
