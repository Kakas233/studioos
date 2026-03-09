"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface MLStatsTabProps {
  site: string;
  name: string;
  dateRange: { start: string; end: string };
}

function StatMini({ label, value }: { label: string; value: string | number | undefined }) {
  return (
    <div className="bg-white/[0.03] rounded-lg p-2.5">
      <p className="text-[10px] text-[#A8A49A]/40 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-white">{value ?? "-"}</p>
    </div>
  );
}

export default function MLStatsTab({ site, name, dateRange }: MLStatsTabProps) {
  const [rank, setRank] = useState<any>(null);
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [site, name, dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rankRes, actRes] = await Promise.all([
        fetch("/api/lookup/model", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "rank", site, name, range: [dateRange.start, dateRange.end] }),
        }).then((r) => r.json()),
        fetch("/api/lookup/model", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "activity", site, name, range: [dateRange.start, dateRange.end] }),
        }).then((r) => r.json()),
      ]);
      setRank(rankRes?.rank || null);
      setActivity(actRes?.activity || null);
    } catch (err) {
      console.error("Stats load error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-[#C9A84C] animate-spin" /></div>;
  }

  const rankData = rank?.ranks || [];
  const TrendIcon = rank?.summary?.trend === "improving" ? TrendingUp : rank?.summary?.trend === "declining" ? TrendingDown : Minus;

  // Income by day from rank data
  const incomeData = rankData.map((r: any) => ({
    date: r.date,
    tokens: r.tokens || 0,
    usd: r.tokens ? r.tokens * 0.05 : 0,
  }));

  // Hourly activity
  const hourlyData = activity?.hourly?.map((h: any) => ({
    hour: `${String(h.hour).padStart(2, "0")}:00`,
    usd: h.usd_sum || 0,
    tips: h.tip_count || 0,
  })) || [];

  return (
    <div className="space-y-4">
      {/* Rank summary */}
      {rank?.summary && (
        <Card className="bg-[#111111] border-white/[0.04]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              Model Rank
              <TrendIcon className={`w-4 h-4 ${rank.summary.trend === "improving" ? "text-emerald-400" : rank.summary.trend === "declining" ? "text-red-400" : "text-[#A8A49A]/40"}`} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <StatMini label="Current Rank" value={`#${rank.summary.last_rank}`} />
              <StatMini label="Best Rank" value={`#${rank.summary.best_rank}`} />
              <StatMini label="Change" value={rank.summary.rank_change > 0 ? `+${rank.summary.rank_change}` : String(rank.summary.rank_change)} />
              <StatMini label="Total Tokens" value={rank.summary.total_tokens?.toLocaleString()} />
            </div>
            {rankData.length > 0 && (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={rankData}>
                    <defs>
                      <linearGradient id="rankGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#A8A49A60" }} tickLine={false} axisLine={false} />
                    <YAxis reversed tick={{ fontSize: 10, fill: "#A8A49A60" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="rank" stroke="#10b981" fill="url(#rankGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Income chart */}
      {incomeData.length > 0 && (
        <Card className="bg-[#111111] border-white/[0.04]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-white">Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={incomeData}>
                  <defs>
                    <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f472b6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#A8A49A60" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#A8A49A60" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="tokens" stroke="#f472b6" fill="url(#incGrad)" strokeWidth={2} name="Tokens" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hourly activity */}
      {hourlyData.length > 0 && (
        <Card className="bg-[#111111] border-white/[0.04]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-white">Income by Hour of Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyData}>
                  <defs>
                    <linearGradient id="hourGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#A8A49A60" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#A8A49A60" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="usd" stroke="#a78bfa" fill="url(#hourGrad)" strokeWidth={2} name="$ USD" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
