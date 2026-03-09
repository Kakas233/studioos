"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Loader2, ExternalLink } from "lucide-react";
import { format } from "date-fns";

const PLATFORM_LABELS: Record<string, string> = {
  mfc: "MyFreeCams", cb: "Chaturbate", sc: "StripChat", bc: "BongaCams",
  cs: "CamSoda", lj: "LiveJasmin", f4f: "Flirt4Free", c4: "Cam4",
  sm: "Streamate",
};

const PLATFORM_COLORS: Record<string, string> = {
  mfc: "#006E00", cb: "#F47421", sc: "#A2242D", bc: "#A02239",
  cs: "#01B0FA", lj: "#BA0000", f4f: "#00AEEF", c4: "#FF6B00",
  sm: "#c73d7d",
};

const PROB_COLORS: Record<string, string> = {
  high: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  low: "bg-red-500/15 text-red-400 border-red-500/20",
};

interface ModelSimilarAccountsProps {
  similar: Record<string, any[]> | null;
  loading: boolean;
  onSelect?: (model: any) => void;
}

export default function ModelSimilarAccounts({ similar, loading, onSelect }: ModelSimilarAccountsProps) {
  if (loading) {
    return (
      <Card className="bg-[#111111] border-white/[0.04]">
        <CardContent className="p-8 flex items-center justify-center gap-2 text-[#A8A49A]/40">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading similar accounts...
        </CardContent>
      </Card>
    );
  }

  if (!similar || Object.keys(similar).length === 0) return null;

  // Flatten all predictions from all persons
  const allPredictions: any[] = [];
  for (const [personId, predictions] of Object.entries(similar)) {
    if (Array.isArray(predictions)) {
      for (const pred of predictions) {
        allPredictions.push({ ...pred, personId });
      }
    }
  }

  // Sort by distance (lower = better match)
  allPredictions.sort((a, b) => a.distance - b.distance);

  // Show top 20
  const topPredictions = allPredictions.slice(0, 20);

  if (topPredictions.length === 0) return null;

  return (
    <Card className="bg-[#111111] border-white/[0.04]">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          Similar Accounts ({topPredictions.length})
        </CardTitle>
        <p className="text-xs text-[#A8A49A]/40 mt-1">Accounts with matching face data across cam platforms.</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {topPredictions.map((pred: any, idx: number) => {
            const color = PLATFORM_COLORS[pred.platform] || "#C9A84C";
            return (
              <div
                key={`${pred.platform}-${pred.model}-${idx}`}
                className="bg-white/[0.02] border border-white/[0.04] rounded-lg overflow-hidden hover:border-white/[0.08] transition-all cursor-pointer"
                onClick={() => onSelect?.({ name: pred.model, platform: pred.platform, gender: pred.gender })}
              >
                {/* Face image */}
                <div className="relative h-32 bg-black/40 flex items-center justify-center overflow-hidden">
                  {pred.urls?.fullImage ? (
                    <img src={pred.urls.fullImage} alt={pred.model} className="max-w-full max-h-32 object-contain" loading="lazy" />
                  ) : (
                    <div className="text-[#A8A49A]/20 text-2xl font-bold">{pred.model?.charAt(0)?.toUpperCase()}</div>
                  )}
                  <div className="absolute top-1.5 left-1.5">
                    <Badge className="text-[9px] font-semibold border-0" style={{ backgroundColor: `${color}30`, color }}>
                      {PLATFORM_LABELS[pred.platform] || pred.platform}
                    </Badge>
                  </div>
                  <div className="absolute top-1.5 right-1.5">
                    <Badge variant="outline" className={`text-[9px] ${PROB_COLORS[pred.probability] || PROB_COLORS.low}`}>
                      {pred.probability}
                    </Badge>
                  </div>
                </div>

                {/* Info */}
                <div className="p-2.5">
                  <p className="text-sm font-medium text-white truncate">{pred.model}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-[#A8A49A]/40">
                      {pred.seen ? format(new Date(pred.seen), "MMM yyyy") : ""}
                    </span>
                    <div className="flex gap-1">
                      <a href={pred.urls?.externalProfile} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                        <ExternalLink className="w-3 h-3 text-[#A8A49A]/30 hover:text-[#C9A84C]" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
