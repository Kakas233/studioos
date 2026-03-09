"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Heart, Crown } from "lucide-react";

interface MemberTopModelsProps {
  site: string;
  username: string;
  rangeStart: string | null;
  rangeEnd: string | null;
}

export default function MemberTopModels({ site, username, rangeStart, rangeEnd }: MemberTopModelsProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopModels();
  }, [site, username, rangeStart, rangeEnd]);

  const fetchTopModels = async () => {
    setLoading(true);
    try {
      const params: any = { action: "top_models", site, username };
      if (rangeStart) params.range_start = rangeStart;
      if (rangeEnd) params.range_end = rangeEnd;
      const res = await fetch("/api/lookup/member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const result = await res.json();
      setData(result.data || []);
    } catch (err) {
      console.error("Failed to fetch top models:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-[#111111] border-white/[0.04]">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-base flex items-center gap-2">
          <Heart className="w-4 h-4 text-pink-400" />
          Top Models Tipped
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#C9A84C]" />
          </div>
        ) : data.length === 0 ? (
          <p className="text-center text-[#A8A49A]/30 text-sm py-8">No tipping data found</p>
        ) : (
          <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1">
            {data.slice(0, 20).map((model: any, i: number) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.02] transition-colors"
              >
                <span className="w-6 text-center text-xs font-medium text-[#A8A49A]/40">
                  {i === 0 ? <Crown className="w-4 h-4 text-[#C9A84C] mx-auto" /> : `#${i + 1}`}
                </span>
                <div className="w-8 h-8 bg-white/[0.04] rounded-full flex items-center justify-center text-xs text-white/60 font-medium">
                  {model.name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/model-lookup?site=${site}&name=${encodeURIComponent(model.name)}`}
                    className="text-sm text-white font-medium truncate block hover:text-emerald-400 hover:underline"
                  >
                    {model.name}
                  </Link>
                  <p className="text-[10px] text-[#A8A49A]/30">
                    {model.days || 0} day{model.days !== 1 ? "s" : ""} · {model.daily_tokens?.toLocaleString() || 0} tk/day
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#C9A84C]">{model.total_tokens?.toLocaleString()} tk</p>
                  <p className="text-[10px] text-[#A8A49A]/30">${model.total_usd?.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
