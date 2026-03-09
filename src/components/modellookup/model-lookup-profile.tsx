"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, ExternalLink, Trophy } from "lucide-react";
import { format, subDays } from "date-fns";

import ModelLookupTabs from "./model-lookup-tabs";
import MLStatsTab from "./ml-stats-tab";
import MLSessionsTab from "./ml-sessions-tab";
import MLTimelineTab from "./ml-timeline-tab";
import MLTipsTab from "./ml-tips-tab";
import MLTopMembersTab from "./ml-top-members-tab";
import MLChatTab from "./ml-chat-tab";
import MLProfileTab from "./ml-profile-tab";

const SITE_LABELS: Record<string, string> = {
  chaturbate: "Chaturbate", stripchat: "StripChat", bongacams: "BongaCams",
  camsoda: "CamSoda", mfc: "MyFreeCams", livejasmin: "LiveJasmin",
};
const SITE_COLORS: Record<string, string> = {
  chaturbate: "#F47421", stripchat: "#A2242D", bongacams: "#A02239",
  camsoda: "#01B0FA", mfc: "#006E00", livejasmin: "#BA0000",
};

function StatBox({ label, value, green }: { label: string; value: string | number; green?: boolean }) {
  return (
    <div className="bg-white/[0.03] rounded-lg p-2.5">
      <p className="text-[10px] text-[#A8A49A]/40 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${green ? "text-emerald-400" : "text-white"}`}>{value}</p>
    </div>
  );
}

function DateRangeSelector({ dateRange, setDateRange }: { dateRange: { start: string; end: string }; setDateRange: (r: { start: string; end: string }) => void }) {
  const presets = [
    { label: "7d", days: 7 },
    { label: "14d", days: 14 },
    { label: "30d", days: 30 },
    { label: "90d", days: 90 },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-[#A8A49A]/40">Date range:</span>
      <input
        type="date"
        value={dateRange.start.split(" ")[0]}
        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value + " 00:00:00" })}
        className="h-8 px-2 text-xs bg-white/[0.03] border border-white/[0.06] text-white rounded-lg [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
      />
      <span className="text-[#A8A49A]/30 text-xs">{"\u2192"}</span>
      <input
        type="date"
        value={dateRange.end.split(" ")[0]}
        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value + " 23:59:59" })}
        className="h-8 px-2 text-xs bg-white/[0.03] border border-white/[0.06] text-white rounded-lg [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
      />
      <div className="flex gap-1 ml-auto">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => setDateRange({
              start: format(subDays(new Date(), p.days), "yyyy-MM-dd") + " 00:00:00",
              end: format(new Date(), "yyyy-MM-dd") + " 23:59:59",
            })}
            className="h-7 px-2.5 text-[10px] text-[#A8A49A]/50 hover:text-white hover:bg-white/[0.04] rounded-md transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface ModelLookupProfileProps {
  site: string;
  name: string;
  onBack: () => void;
}

export default function ModelLookupProfile({ site, name, onBack }: ModelLookupProfileProps) {
  const [tab, setTab] = useState("stats");
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<any>(null);
  const [cgf, setCgf] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 7), "yyyy-MM-dd") + " 00:00:00",
    end: format(new Date(), "yyyy-MM-dd") + " 23:59:59",
  });

  const color = SITE_COLORS[site] || "#C9A84C";

  useEffect(() => {
    loadInfo();
  }, [site, name, dateRange]);

  const loadInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lookup/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "info",
          site,
          name,
          range: [dateRange.start, dateRange.end],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setInfo(data.info);
        setCgf(data.cgf);
      }
    } catch (err) {
      console.error("Model info error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !info) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" />
      </div>
    );
  }

  if (!info && !cgf) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={onBack} className="text-[#A8A49A]/60 hover:text-white -ml-2 gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="bg-[#111111] border border-red-500/10 rounded-xl p-12 text-center">
          <p className="text-white/70 text-sm font-medium">Model &quot;{name}&quot; not found on {SITE_LABELS[site]}</p>
          <p className="text-[#A8A49A]/30 text-xs mt-2">Check the spelling or try a different platform.</p>
        </div>
      </div>
    );
  }

  const mainPerson = cgf?.persons?.[0];
  const imageUrl = mainPerson?.urls?.fullImage || null;
  const rank = info?.rank;

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="text-[#A8A49A]/60 hover:text-white -ml-2 gap-2">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      {/* Header */}
      <Card className="bg-[#111111] border-white/[0.04]">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col md:flex-row gap-5">
            {/* Image */}
            <div className="relative w-full md:w-60 h-52 bg-black/40 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
              {imageUrl ? (
                <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-[#A8A49A]/20 text-5xl font-bold uppercase">{name.charAt(0)}</div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge className="text-xs font-semibold border-0 uppercase" style={{ backgroundColor: `${color}30`, color }}>
                      {SITE_LABELS[site]?.charAt(0)}
                    </Badge>
                    <h2 className="text-2xl font-bold text-white">{name}</h2>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge className="text-xs font-semibold border-0" style={{ backgroundColor: `${color}25`, color }}>
                      {SITE_LABELS[site]}
                    </Badge>
                    {rank != null && (
                      <Badge variant="outline" className="text-xs text-emerald-400 border-emerald-500/20 gap-1">
                        <Trophy className="w-3 h-3" /> Rank: {rank}
                      </Badge>
                    )}
                  </div>
                </div>
                {cgf?.urls?.externalProfile && (
                  <a href={cgf.urls.externalProfile} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="text-xs gap-1.5 bg-[#C9A84C] hover:bg-[#B8973B] text-black">
                      <ExternalLink className="w-3.5 h-3.5" /> Visit Room
                    </Button>
                  </a>
                )}
              </div>

              {/* Summary stats */}
              {info && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <StatBox label="Total Income" value={info.income ? `$${(info.income.usd || 0).toFixed(2)}` : "-"} green />
                    <StatBox label="Total Sessions" value={info.sessions?.count ?? "-"} />
                    <StatBox label="Total Hours" value={info.sessions?.total_duration ? (info.sessions.total_duration / 60).toFixed(1) : "-"} />
                    <StatBox label="Avg Income/Hour" value={info.sessions?.total_duration > 0 ? `$${((info.income?.usd || 0) / (info.sessions.total_duration / 60)).toFixed(2)}` : "-"} green />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    <StatBox label="Total Tokens" value={info.income?.tokens?.toLocaleString() ?? "-"} green />
                    <StatBox label="Avg Session" value={info.sessions?.average_duration ? `${(info.sessions.average_duration / 60).toFixed(1)}h` : "-"} />
                    <StatBox label="Tags" value={info.tags?.length || "-"} />
                  </div>
                </>
              )}
              {!info && cgf && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <StatBox label="First Seen" value={cgf.firstSeen ? format(new Date(cgf.firstSeen), "MMM d, yyyy") : "-"} />
                  <StatBox label="Last Seen" value={cgf.lastSeen ? format(new Date(cgf.lastSeen), "MMM d, yyyy") : "-"} />
                  <StatBox label="Persons" value={cgf.persons?.length || 0} />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <ModelLookupTabs activeTab={tab} onTabChange={setTab} />

      {/* Date Range */}
      <DateRangeSelector dateRange={dateRange} setDateRange={setDateRange} />

      {/* Tab content */}
      {tab === "stats" && <MLStatsTab site={site} name={name} dateRange={dateRange} />}
      {tab === "sessions" && <MLSessionsTab site={site} name={name} dateRange={dateRange} />}
      {tab === "timeline" && <MLTimelineTab site={site} name={name} dateRange={dateRange} />}
      {tab === "tips" && <MLTipsTab site={site} name={name} dateRange={dateRange} />}
      {tab === "top-members" && <MLTopMembersTab site={site} name={name} dateRange={dateRange} />}
      {tab === "chat" && <MLChatTab site={site} name={name} dateRange={dateRange} />}
      {tab === "profile" && <MLProfileTab site={site} name={name} cgf={cgf} />}
    </div>
  );
}
