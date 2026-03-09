"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { format } from "date-fns";

interface MLSessionsTabProps {
  site: string;
  name: string;
  dateRange: { start: string; end: string };
}

export default function MLSessionsTab({ site, name, dateRange }: MLSessionsTabProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState("2");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadSessions();
  }, [site, name, dateRange, granularity]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lookup/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sessions",
          site,
          name,
          range: [dateRange.start, dateRange.end],
          window: parseInt(granularity),
        }),
      });
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error("Sessions error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = sessions.filter((s: any) => {
    if (!search) return true;
    const dateStr = format(new Date(s.start_time), "yyyy-MM-dd");
    return dateStr.includes(search);
  });

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-[#C9A84C] animate-spin" /></div>;
  }

  return (
    <Card className="bg-[#111111] border-white/[0.04]">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold text-white">Sessions ({filtered.length})</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={granularity} onValueChange={(v) => v !== null && setGranularity(v)}>
              <SelectTrigger className="w-32 h-8 text-xs bg-white/[0.03] border-white/[0.06] text-white rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 hour</SelectItem>
                <SelectItem value="2">2 hours</SelectItem>
                <SelectItem value="4">4 hours</SelectItem>
                <SelectItem value="6">6 hours</SelectItem>
                <SelectItem value="12">12 hours</SelectItem>
                <SelectItem value="24">24 hours</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A8A49A]/30" />
              <Input
                placeholder="Search sessions"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 w-40 text-xs bg-white/[0.03] border-white/[0.06] text-white rounded-lg"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] text-[#A8A49A]/40 uppercase tracking-wider border-b border-white/[0.04]">
                <th className="text-left pb-2 pr-4">Stream date</th>
                <th className="text-left pb-2 pr-4">Duration</th>
                <th className="text-left pb-2 pr-4">Tips</th>
                <th className="text-left pb-2 pr-4">Members</th>
                <th className="text-left pb-2 pr-4">$/hour</th>
                <th className="text-left pb-2">Total $</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s: any, i: number) => (
                <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                  <td className="py-2.5 pr-4 text-emerald-400 text-xs">
                    {format(new Date(s.start_time), "MMM dd, yyyy HH:mm")} - {format(new Date(s.end_time), "HH:mm")}
                  </td>
                  <td className="py-2.5 pr-4 text-white/80 text-xs">{s.duration_hours?.toFixed(2)} hours</td>
                  <td className="py-2.5 pr-4 text-white/80 text-xs">{s.tips || 0}</td>
                  <td className="py-2.5 pr-4 text-white/80 text-xs">{s.dons || 0}</td>
                  <td className="py-2.5 pr-4 text-white/80 text-xs">${s.usd_per_hour?.toFixed(0) || 0}</td>
                  <td className="py-2.5 text-white/80 text-xs">${s.total_usd?.toFixed(2) || "0.00"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#A8A49A]/30 text-xs">No sessions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
