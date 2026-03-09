"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Coins, ChevronLeft, ChevronRight } from "lucide-react";

interface MemberTipHistoryProps {
  site: string;
  username: string;
  rangeStart: string | null;
  rangeEnd: string | null;
}

export default function MemberTipHistory({ site, username, rangeStart, rangeEnd }: MemberTipHistoryProps) {
  const [tips, setTips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<any>(null);

  useEffect(() => {
    setPage(1);
  }, [site, username, rangeStart, rangeEnd]);

  useEffect(() => {
    fetchTips();
  }, [site, username, rangeStart, rangeEnd, page]);

  const fetchTips = async () => {
    setLoading(true);
    try {
      const params: any = { action: "tips", site, username, page, per_page: 25 };
      if (rangeStart) params.range_start = rangeStart;
      if (rangeEnd) params.range_end = rangeEnd;
      const res = await fetch("/api/lookup/member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const result = await res.json();
      setTips(result.data || []);
      setMeta(result.meta || null);
    } catch (err) {
      console.error("Failed to fetch tips:", err);
    } finally {
      setLoading(false);
    }
  };

  const pagination = meta?.pagination;
  const totalPages = pagination?.last_page || 1;

  return (
    <Card className="bg-[#111111] border-white/[0.04]">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Coins className="w-4 h-4 text-[#C9A84C]" />
            Tip History
          </CardTitle>
          {pagination && (
            <span className="text-[10px] text-[#A8A49A]/40">
              {pagination.total?.toLocaleString()} total tips
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#C9A84C]" />
          </div>
        ) : tips.length === 0 ? (
          <p className="text-center text-[#A8A49A]/30 text-sm py-8">No tips found</p>
        ) : (
          <>
            <div className="space-y-0.5 max-h-[400px] overflow-y-auto pr-1">
              {tips.map((tip: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.02] transition-colors"
                >
                  <div className="w-7 h-7 bg-white/[0.04] rounded-full flex items-center justify-center text-[10px] text-white/60 font-medium">
                    {tip.model?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/model-lookup?site=${site}&name=${encodeURIComponent(tip.model)}`}
                      className="text-sm text-white truncate block hover:text-emerald-400 hover:underline"
                    >
                      {tip.model}
                    </Link>
                    <p className="text-[10px] text-[#A8A49A]/30">
                      {new Date(tip.time).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#C9A84C]">{tip.tokens?.toLocaleString()} tk</p>
                    <p className="text-[10px] text-[#A8A49A]/30">${tip.usd?.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-white/[0.04]">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-7 text-[#A8A49A]/40 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-[#A8A49A]/40">
                  Page {page} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-7 text-[#A8A49A]/40 hover:text-white"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
