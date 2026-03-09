"use client";

import { Badge } from "@/components/ui/badge";
import { ExternalLink, Calendar, Eye } from "lucide-react";
import { format } from "date-fns";

const PLATFORM_LABELS: Record<string, string> = {
  mfc: "MyFreeCams", cb: "Chaturbate", sc: "StripChat", bc: "BongaCams",
  cs: "CamSoda", lj: "LiveJasmin", f4f: "Flirt4Free", c4: "Cam4",
  sm: "Streamate", sr: "StreamRay", xl: "XloveCam", im: "ImLive",
  ctv: "CherryTV", stv: "ShowUpTV", atv: "AmateurTV",
};

const PLATFORM_COLORS: Record<string, string> = {
  mfc: "#006E00", cb: "#F47421", sc: "#A2242D", bc: "#A02239",
  cs: "#01B0FA", lj: "#BA0000", f4f: "#00AEEF", c4: "#FF6B00",
  sm: "#c73d7d", sr: "#8B5CF6", xl: "#E91E63", im: "#FF9800",
};

interface ModelSearchResultsProps {
  results: any[] | null;
  onSelect: (model: any) => void;
}

export default function ModelSearchResults({ results, onSelect }: ModelSearchResultsProps) {
  if (!results) return null;

  if (results.length === 0) {
    return (
      <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-12 text-center">
        <p className="text-[#A8A49A]/40 text-sm">No models found. Try a different name or platform.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-[#A8A49A]/40">{results.length} result{results.length !== 1 ? "s" : ""} found</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {results.slice(0, 30).map((model: any, idx: number) => {
          const mainPerson = model.persons?.[0];
          const color = PLATFORM_COLORS[model.platform] || "#C9A84C";

          return (
            <div
              key={`${model.platform}-${model.name}-${idx}`}
              onClick={() => onSelect(model)}
              className="bg-[#111111] border border-white/[0.04] rounded-xl overflow-hidden cursor-pointer hover:border-white/[0.1] transition-all group"
            >
              {/* Image */}
              <div className="relative h-44 bg-black/40 flex items-center justify-center overflow-hidden">
                {mainPerson?.urls?.fullImage ? (
                  <img
                    src={mainPerson.urls.fullImage}
                    alt={model.name}
                    className="max-w-full max-h-44 object-contain group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-[#A8A49A]/20 text-4xl font-bold">{model.name?.charAt(0)?.toUpperCase()}</div>
                )}
                {/* Platform badge */}
                <div className="absolute top-2 left-2">
                  <Badge className="text-[10px] font-semibold border-0" style={{ backgroundColor: `${color}30`, color }}>
                    {PLATFORM_LABELS[model.platform] || model.platform}
                  </Badge>
                </div>
                {/* Persons count */}
                {model.persons?.length > 1 && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="text-[10px] bg-black/60 text-white border-white/20">
                      {model.persons.length} persons
                    </Badge>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <h3 className="font-semibold text-white text-sm truncate">{model.name}</h3>
                  <Badge variant="outline" className="text-[10px] capitalize shrink-0 ml-2">
                    {model.gender === "f" ? "Female" : model.gender === "m" ? "Male" : model.gender === "t" ? "Trans" : "Couple"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-[#A8A49A]/40">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {model.faces || 0} faces
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {model.lastSeen ? format(new Date(model.lastSeen), "MMM d, yyyy") : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
