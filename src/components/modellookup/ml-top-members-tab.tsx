"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";

interface MLTopMembersTabProps {
  site: string;
  name: string;
  dateRange: { start: string; end: string };
}

function StatBox({ label, value, green }: { label: string; value: string | number | undefined; green?: boolean }) {
  return (
    <div className="bg-[#111111] border border-white/[0.04] rounded-lg p-3">
      <p className="text-[10px] text-[#A8A49A]/40 uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm font-semibold ${green ? "text-emerald-400" : "text-white"}`}>{value ?? "-"}</p>
    </div>
  );
}

export default function MLTopMembersTab({ site, name, dateRange }: MLTopMembersTabProps) {
  const [members, setMembers] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { loadMembers(); }, [site, name, dateRange]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lookup/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "members",
          site,
          name,
          range: [dateRange.start, dateRange.end],
        }),
      });
      const data = await res.json();
      setMembers(data.members || null);
    } catch (err) {
      console.error("Members error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-[#C9A84C] animate-spin" /></div>;
  }

  const topMembers = members?.top_members || [];
  const filtered = topMembers.filter((m: any) => {
    if (!search) return true;
    return m.name?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-4">
      {/* Summary */}
      {members?.summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatBox label="Total Members" value={members.summary.total_members} />
          <StatBox label="Total Tokens" value={members.summary.total_tokens?.toLocaleString()} />
          <StatBox label="Total USD" value={`$${members.summary.total_usd?.toFixed(2)}`} green />
          <StatBox label="Avg/Member" value={`$${members.summary.average_per_member_usd?.toFixed(2)}`} green />
        </div>
      )}

      <Card className="bg-[#111111] border-white/[0.04]">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-sm font-semibold text-white">Top Members</CardTitle>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A8A49A]/30" />
              <Input
                placeholder="Search member"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 w-44 text-xs bg-white/[0.03] border-white/[0.06] text-white rounded-lg"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] text-[#A8A49A]/40 uppercase tracking-wider border-b border-white/[0.04]">
                  <th className="text-left pb-2 pr-4 w-10">#</th>
                  <th className="text-left pb-2 pr-4">Member</th>
                  <th className="text-left pb-2 pr-4">Avg/day</th>
                  <th className="text-left pb-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m: any, i: number) => (
                  <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                    <td className="py-2.5 pr-4 text-[#A8A49A]/40 text-xs">{i + 1}</td>
                    <td className="py-2.5 pr-4 text-xs font-medium">
                      <Link
                        href={`/member-lookup?site=${site}&username=${encodeURIComponent(m.name)}`}
                        className="text-emerald-400 hover:text-emerald-300 hover:underline"
                      >
                        {m.name}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-4 text-white/80 text-xs">
                      {(() => {
                        const tokens = m.daily_tokens || m.tokens;
                        const usd = m.daily_usd || m.usd;
                        if (!tokens && !usd) return "-";
                        if (m.first_tip && m.last_tip && tokens) {
                          const days = Math.max(1, Math.ceil((new Date(m.last_tip).getTime() - new Date(m.first_tip).getTime()) / 86400000));
                          const avgTokens = Math.round(tokens / days);
                          const avgUsd = usd ? (usd / days).toFixed(0) : null;
                          return `${avgTokens.toLocaleString()} tk${avgUsd ? ` · $${avgUsd}` : ""}`;
                        }
                        return tokens ? `${tokens.toLocaleString()} tk` : "-";
                      })()}
                    </td>
                    <td className="py-2.5 text-white/80 text-xs">
                      {(() => {
                        const tokens = m.total_tokens || m.tokens;
                        const usd = m.total_usd || m.usd;
                        if (!tokens && !usd) return "-";
                        return `${tokens ? tokens.toLocaleString() + " tk" : ""}${usd ? ` · $${usd.toFixed ? usd.toFixed(0) : usd}` : ""}`;
                      })()}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-[#A8A49A]/30 text-xs">No members found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
