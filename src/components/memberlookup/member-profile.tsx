"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, User } from "lucide-react";
import MemberStats from "./member-stats";
import MemberDailyTokens from "./member-daily-tokens";
import MemberTopModels from "./member-top-models";
import MemberTipHistory from "./member-tip-history";
import MemberActivityChart from "./member-activity-chart";
import MemberChatHistory from "./member-chat-history";

const SITE_LABELS: Record<string, string> = {
  chaturbate: "Chaturbate",
  stripchat: "Stripchat",
  bongacams: "Bongacams",
  camsoda: "Camsoda",
  mfc: "MyFreeCams",
  livejasmin: "LiveJasmin",
};

const SITE_COLORS: Record<string, string> = {
  chaturbate: "bg-[#F47421]/15 text-[#F47421]",
  stripchat: "bg-[#A2242D]/15 text-[#A2242D]",
  bongacams: "bg-[#A02239]/15 text-[#A02239]",
  camsoda: "bg-[#01B0FA]/15 text-[#01B0FA]",
  mfc: "bg-[#006E00]/15 text-[#006E00]",
  livejasmin: "bg-[#BA0000]/15 text-[#BA0000]",
};

interface MemberProfileProps {
  member: any;
}

export default function MemberProfile({ member }: MemberProfileProps) {
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [appliedRange, setAppliedRange] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });

  if (!member) return null;

  const site = member.site;
  const username = member.username || member.name;

  const handleApply = () => {
    setAppliedRange({
      start: rangeStart ? `${rangeStart} 00:00:00` : null,
      end: rangeEnd ? `${rangeEnd} 23:59:59` : null,
    });
  };

  const handleClear = () => {
    setRangeStart("");
    setRangeEnd("");
    setAppliedRange({ start: null, end: null });
  };

  return (
    <div className="space-y-5 mt-2">
      {/* Member header */}
      <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-14 h-14 bg-[#C9A84C]/10 rounded-xl flex items-center justify-center border border-[#C9A84C]/20">
          <User className="w-6 h-6 text-[#C9A84C]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">{username}</h3>
            <Badge className={`${SITE_COLORS[site] || "bg-white/10 text-white"} text-[10px] border-0`}>
              {SITE_LABELS[site] || site}
            </Badge>
          </div>
          <p className="text-xs text-[#A8A49A]/40 mt-0.5">
            Data since {member.first_tip_date ? new Date(member.first_tip_date).toLocaleDateString() : "unknown"}
          </p>
        </div>
      </div>

      {/* Date range filter */}
      <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <Calendar className="w-4 h-4 text-[#A8A49A]/40 hidden sm:block" />
        <span className="text-xs text-[#A8A49A]/40">Filter by range:</span>
        <Input
          type="date"
          value={rangeStart}
          onChange={(e) => setRangeStart(e.target.value)}
          className="w-36 h-8 text-xs bg-white/[0.03] border-white/[0.06] text-white rounded-lg [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
        />
        <span className="text-[#A8A49A]/30 text-xs">{"\u2192"}</span>
        <Input
          type="date"
          value={rangeEnd}
          onChange={(e) => setRangeEnd(e.target.value)}
          className="w-36 h-8 text-xs bg-white/[0.03] border-white/[0.06] text-white rounded-lg [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
        />
        <Button size="sm" onClick={handleApply} className="h-8 bg-[#C9A84C] hover:bg-[#B8973B] text-black text-xs">
          Apply
        </Button>
        {(rangeStart || rangeEnd) && (
          <Button size="sm" variant="ghost" onClick={handleClear} className="h-8 text-xs text-[#A8A49A]/40">
            Clear
          </Button>
        )}
      </div>

      {/* Stats */}
      <MemberStats info={member} />

      {/* Daily tokens chart */}
      <MemberDailyTokens info={member} />

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <MemberTopModels
          site={site}
          username={username}
          rangeStart={appliedRange.start}
          rangeEnd={appliedRange.end}
        />
        <MemberTipHistory
          site={site}
          username={username}
          rangeStart={appliedRange.start}
          rangeEnd={appliedRange.end}
        />
      </div>

      {/* Chat messages */}
      <MemberChatHistory
        site={site}
        username={username}
        rangeStart={appliedRange.start}
        rangeEnd={appliedRange.end}
      />

      {/* Activity chart */}
      <MemberActivityChart
        site={site}
        username={username}
        rangeStart={appliedRange.start}
        rangeEnd={appliedRange.end}
      />
    </div>
  );
}
