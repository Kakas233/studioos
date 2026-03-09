"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface MemberActivityChartProps {
  site: string;
  username: string;
  rangeStart: string | null;
  rangeEnd: string | null;
}

export default function MemberActivityChart({ site, username, rangeStart, rangeEnd }: MemberActivityChartProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"hourly" | "daily">("hourly");

  useEffect(() => {
    fetchActivity();
  }, [site, username, rangeStart, rangeEnd]);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const params: any = { action: "activity", site, username };
      if (rangeStart) params.range_start = rangeStart;
      if (rangeEnd) params.range_end = rangeEnd;
      const res = await fetch("/api/lookup/member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const result = await res.json();
      setData(result.data || null);
    } catch (err) {
      console.error("Failed to fetch activity:", err);
    } finally {
      setLoading(false);
    }
  };

  const hourlyData = (data?.hourly || []).map((h: any) => ({
    name: `${String(h.hour).padStart(2, "0")}:00`,
    tokens: h.token_sum || 0,
    tips: h.tip_count || 0,
  }));

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyData = (data?.daily || []).map((d: any) => ({
    name: d.day_name || dayNames[d.day_of_week] || `Day ${d.day_of_week}`,
    tokens: d.token_sum || 0,
    tips: d.tip_count || 0,
  }));

  const chartData = view === "hourly" ? hourlyData : dailyData;
  const maxVal = Math.max(...chartData.map((d: any) => d.tokens), 1);

  return (
    <Card className="bg-[#111111] border-white/[0.04]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Activity Patterns
          </CardTitle>
          <div className="flex gap-1">
            {(["hourly", "daily"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-2.5 py-1 text-[10px] rounded-md font-medium transition-colors ${
                  view === v
                    ? "bg-[#C9A84C]/15 text-[#C9A84C]"
                    : "text-[#A8A49A]/30 hover:text-[#A8A49A]/60"
                }`}
              >
                {v === "hourly" ? "By Hour" : "By Day"}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#C9A84C]" />
          </div>
        ) : chartData.length === 0 ? (
          <p className="text-center text-[#A8A49A]/30 text-sm py-8">No activity data</p>
        ) : (
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#A8A49A60", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  interval={view === "hourly" ? 2 : 0}
                />
                <YAxis
                  tick={{ fill: "#A8A49A40", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1a1a1a",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                  formatter={(val: number, name: string) => [
                    name === "tokens" ? `${val.toLocaleString()} tokens` : `${val} tips`,
                    name === "tokens" ? "Tokens" : "Tips",
                  ]}
                />
                <Bar dataKey="tokens" radius={[3, 3, 0, 0]} maxBarSize={view === "hourly" ? 14 : 36}>
                  {chartData.map((entry: any, idx: number) => (
                    <Cell
                      key={idx}
                      fill={`rgba(201, 168, 76, ${0.25 + (entry.tokens / maxVal) * 0.75})`}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
