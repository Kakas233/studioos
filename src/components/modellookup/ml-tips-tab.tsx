"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";

interface MLTipsTabProps {
  site: string;
  name: string;
  dateRange: { start: string; end: string };
}

export default function MLTipsTab({ site, name, dateRange }: MLTipsTabProps) {
  const [tips, setTips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);
  const [search, setSearch] = useState("");

  useEffect(() => { setPage(1); }, [site, name, dateRange]);
  useEffect(() => { loadTips(); }, [site, name, dateRange, page]);

  const loadTips = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lookup/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "tips",
          site,
          name,
          range: [dateRange.start, dateRange.end],
          page,
          per_page: 50,
        }),
      });
      const data = await res.json();
      setTips(data.tips || []);
      setMeta(data.meta || null);
    } catch (err) {
      console.error("Tips error:", err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = tips.filter((t: any) => {
    if (!search) return true;
    return t.name?.toLowerCase().includes(search.toLowerCase());
  });

  const pagination = meta?.pagination;

  return (
    <Card className="bg-[#111111] border-white/[0.04]">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold text-white">Tips</CardTitle>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#A8A49A]/30" />
            <Input
              placeholder="Search tips"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 w-44 text-xs bg-white/[0.03] border-white/[0.06] text-white rounded-lg"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-[#C9A84C] animate-spin" /></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] text-[#A8A49A]/40 uppercase tracking-wider border-b border-white/[0.04]">
                    <th className="text-left pb-2 pr-4">Time</th>
                    <th className="text-left pb-2 pr-4">Tipper</th>
                    <th className="text-left pb-2 pr-4">Tokens</th>
                    <th className="text-left pb-2">USD</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t: any, i: number) => (
                    <tr key={i} className="border-b border-white/[0.02] hover:bg-white/[0.02]">
                      <td className="py-2.5 pr-4 text-white/60 text-xs">
                        {t.time ? format(new Date(t.time), "yyyy-MM-dd HH:mm:ss") : "-"}
                      </td>
                      <td className="py-2.5 pr-4 text-xs font-medium">
                        {t.name ? (
                          <Link
                            href={`/member-lookup?site=${site}&username=${encodeURIComponent(t.name)}`}
                            className="text-emerald-400 hover:text-emerald-300 hover:underline"
                          >
                            {t.name}
                          </Link>
                        ) : "-"}
                      </td>
                      <td className="py-2.5 pr-4 text-white/80 text-xs">{t.tokens}</td>
                      <td className="py-2.5 text-white/80 text-xs">${t.usd?.toFixed(2) || "0.00"}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={4} className="py-8 text-center text-[#A8A49A]/30 text-xs">No tips found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {pagination && pagination.last_page > 1 && (
              <div className="flex items-center justify-end gap-2 mt-3">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-7 w-7 p-0 border-white/[0.06]">
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                <span className="text-xs text-[#A8A49A]/40">{page} / {pagination.last_page}</span>
                <Button size="sm" variant="outline" disabled={page >= pagination.last_page} onClick={() => setPage((p) => p + 1)} className="h-7 w-7 p-0 border-white/[0.06]">
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
