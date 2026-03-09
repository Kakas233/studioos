"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, ExternalLink, Clock } from "lucide-react";
import { format } from "date-fns";

const PLATFORM_LABELS: Record<string, string> = {
  mfc: "MyFreeCams", cb: "Chaturbate", sc: "StripChat", bc: "BongaCams",
  cs: "CamSoda", lj: "LiveJasmin", f4f: "Flirt4Free", c4: "Cam4", sm: "Streamate",
};
const PLATFORM_COLORS: Record<string, string> = {
  mfc: "#006E00", cb: "#F47421", sc: "#A2242D", bc: "#A02239",
  cs: "#01B0FA", lj: "#BA0000", f4f: "#00AEEF", c4: "#FF6B00", sm: "#c73d7d",
};
const PROB_COLORS: Record<string, string> = {
  high: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  low: "bg-red-500/15 text-red-400 border-red-500/20",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function getColor(value: number) {
  if (value === 0) return "bg-white/[0.03]";
  if (value <= 0.25) return "bg-emerald-500/20";
  if (value <= 0.5) return "bg-emerald-500/40";
  if (value <= 0.75) return "bg-emerald-500/60";
  return "bg-emerald-500/90";
}

function ScheduleHeatmap({ schedule }: { schedule: number[][] }) {
  if (!schedule || schedule.length < 7) return null;
  const hourLabels: string[] = [];
  for (let h = 0; h < 24; h += 2) hourLabels.push(`${h.toString().padStart(2, "0")}:00`);

  return (
    <Card className="bg-[#111111] border-white/[0.04]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" /> Online Schedule (Last 28 Days, UTC)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="flex mb-1 ml-10">
              {hourLabels.map((l) => <div key={l} className="text-[9px] text-[#A8A49A]/30" style={{ width: `${100 / 12}%` }}>{l}</div>)}
            </div>
            {DAYS.map((day, di) => (
              <div key={day} className="flex items-center gap-1 mb-0.5">
                <span className="text-[10px] text-[#A8A49A]/40 w-8 text-right shrink-0">{day}</span>
                <div className="flex-1 flex gap-[1px]">
                  {schedule[di].map((v, si) => (
                    <div key={si} className={`flex-1 h-4 rounded-[2px] ${getColor(v)}`}
                      title={`${day} ${Math.floor(si / 2).toString().padStart(2, "0")}:${si % 2 === 0 ? "00" : "30"} UTC \u2014 ${Math.round(v * 100)}%`} />
                  ))}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-3 ml-10">
              <span className="text-[9px] text-[#A8A49A]/30">Less</span>
              <div className="flex gap-[2px]">
                {["bg-white/[0.03]", "bg-emerald-500/20", "bg-emerald-500/40", "bg-emerald-500/60", "bg-emerald-500/90"].map((c, i) => (
                  <div key={i} className={`w-3 h-3 rounded-sm ${c}`} />
                ))}
              </div>
              <span className="text-[9px] text-[#A8A49A]/30">More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface MLProfileTabProps {
  site: string;
  name: string;
  cgf: any;
}

export default function MLProfileTab({ site, name, cgf: initialCgf }: MLProfileTabProps) {
  const [cgf, setCgf] = useState<any>(initialCgf);
  const [similar, setSimilar] = useState<any>(null);
  const [loading, setLoading] = useState(!initialCgf);

  useEffect(() => {
    if (!initialCgf) loadCgf();
    else loadSimilarOnly();
  }, [site, name]);

  const loadCgf = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lookup/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cgf-profile", site, name }),
      });
      const data = await res.json();
      setCgf(data.profile);
      setSimilar(data.similar);
    } catch (err) {
      console.error("CGF error:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSimilarOnly = async () => {
    try {
      const res = await fetch("/api/lookup/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cgf-profile", site, name }),
      });
      const data = await res.json();
      setSimilar(data.similar);
    } catch (err) {
      console.error("Similar error:", err);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 text-[#C9A84C] animate-spin" /></div>;

  // Flatten similar predictions
  const allSimilar: any[] = [];
  if (similar) {
    for (const [personId, preds] of Object.entries(similar)) {
      if (Array.isArray(preds)) preds.forEach((p: any) => allSimilar.push({ ...p, personId }));
    }
  }
  allSimilar.sort((a, b) => a.distance - b.distance);

  return (
    <div className="space-y-4">
      {/* Persons from CGF */}
      {cgf?.persons?.length > 0 && (
        <Card className="bg-[#111111] border-white/[0.04]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" /> Detected Persons ({cgf.persons.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {cgf.persons.map((person: any, i: number) => (
                <div key={person.person} className="bg-white/[0.02] border border-white/[0.04] rounded-lg overflow-hidden">
                  <div className="h-36 bg-black/40 flex items-center justify-center overflow-hidden">
                    {person.urls?.fullImage ? (
                      <img src={person.urls.fullImage} alt="" className="max-w-full max-h-36 object-contain" loading="lazy" />
                    ) : (
                      <div className="text-[#A8A49A]/20 text-2xl">?</div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-xs font-medium text-white">Person {i + 1}</p>
                    <p className="text-[10px] text-[#A8A49A]/40">{person.faces} faces</p>
                    <p className="text-[10px] text-[#A8A49A]/30">
                      {person.firstSeen ? `${format(new Date(person.firstSeen), "MMM yyyy")} - ${person.lastSeen ? format(new Date(person.lastSeen), "MMM yyyy") : "now"}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule heatmap */}
      {cgf?.schedule && <ScheduleHeatmap schedule={cgf.schedule} />}

      {/* Similar accounts */}
      {allSimilar.length > 0 && (
        <Card className="bg-[#111111] border-white/[0.04]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" /> Similar Accounts ({allSimilar.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {allSimilar.slice(0, 20).map((pred: any, idx: number) => {
                const color = PLATFORM_COLORS[pred.platform] || "#C9A84C";
                return (
                  <div key={`${pred.platform}-${pred.model}-${idx}`} className="bg-white/[0.02] border border-white/[0.04] rounded-lg overflow-hidden hover:border-white/[0.08] transition-all">
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
                    <div className="p-2.5">
                      <p className="text-sm font-medium text-white truncate">{pred.model}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-[#A8A49A]/40">
                          {pred.seen ? format(new Date(pred.seen), "MMM yyyy") : ""}
                        </span>
                        <a href={pred.urls?.externalProfile} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-3 h-3 text-[#A8A49A]/30 hover:text-[#C9A84C]" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {!cgf && (
        <div className="text-center py-12 text-[#A8A49A]/30 text-sm">
          No CamGirlFinder profile data available for this model.
        </div>
      )}
    </div>
  );
}
