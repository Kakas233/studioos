"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ExternalLink, Eye, Users, Loader2 } from "lucide-react";
import { format } from "date-fns";
import ModelScheduleHeatmap from "./model-schedule-heatmap";
import ModelSimilarAccounts from "./model-similar-accounts";

const PLATFORM_LABELS: Record<string, string> = {
  mfc: "MyFreeCams", cb: "Chaturbate", sc: "StripChat", bc: "BongaCams",
  cs: "CamSoda", lj: "LiveJasmin", f4f: "Flirt4Free", c4: "Cam4",
  sm: "Streamate", sr: "StreamRay", xl: "XloveCam", im: "ImLive",
};

const PLATFORM_COLORS: Record<string, string> = {
  mfc: "#006E00", cb: "#F47421", sc: "#A2242D", bc: "#A02239",
  cs: "#01B0FA", lj: "#BA0000", f4f: "#00AEEF", c4: "#FF6B00",
  sm: "#c73d7d",
};

interface ModelProfileViewProps {
  model: any;
  onBack: () => void;
  onSelectModel: (model: any) => void;
}

export default function ModelProfileView({ model, onBack, onSelectModel }: ModelProfileViewProps) {
  const [profile, setProfile] = useState<any>(null);
  const [similar, setSimilar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingSimilar, setLoadingSimilar] = useState(true);
  const color = PLATFORM_COLORS[model.platform] || "#C9A84C";

  useEffect(() => {
    loadProfile();
    loadSimilar();
  }, [model.platform, model.name]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/lookup/model-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "profile", platform: model.platform, model: model.name }),
      });
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
      }
    } catch (err) {
      console.error("Profile load failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadSimilar = async () => {
    setLoadingSimilar(true);
    try {
      const res = await fetch("/api/lookup/model-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "similar", platform: model.platform, model: model.name }),
      });
      const data = await res.json();
      if (data.success) {
        setSimilar(data.similar);
      }
    } catch (err) {
      console.error("Similar load failed:", err);
    } finally {
      setLoadingSimilar(false);
    }
  };

  const displayData = profile || model;
  const mainPerson = displayData.persons?.[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#C9A84C] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Back button */}
      <Button variant="ghost" onClick={onBack} className="text-[#A8A49A]/60 hover:text-white -ml-2 gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to results
      </Button>

      {/* Header card */}
      <Card className="bg-[#111111] border-white/[0.04]">
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row gap-5">
            {/* Image */}
            <div className="relative w-full md:w-64 h-56 bg-black/40 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
              {mainPerson?.urls?.fullImage ? (
                <img
                  src={mainPerson.urls.fullImage}
                  alt={displayData.name}
                  className="max-w-full max-h-56 object-contain"
                />
              ) : (
                <div className="text-[#A8A49A]/20 text-6xl font-bold">{displayData.name?.charAt(0)?.toUpperCase()}</div>
              )}
              {/* Person badges */}
              {displayData.persons?.length > 0 && (
                <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
                  {displayData.persons.map((p: any, i: number) => (
                    <Badge key={p.person} className="text-[10px] bg-white/90 text-black border-0">
                      <Users className="w-3 h-3 mr-1" />
                      Person {i + 1}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">{displayData.name}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className="text-xs font-semibold border-0" style={{ backgroundColor: `${color}30`, color }}>
                      {PLATFORM_LABELS[displayData.platform] || displayData.platform}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {displayData.gender === "f" ? "Female" : displayData.gender === "m" ? "Male" : displayData.gender === "t" ? "Trans" : "Couple"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={displayData.urls?.profile} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="text-xs gap-1.5 border-white/[0.08] text-white hover:bg-white/[0.05]">
                      <Eye className="w-3.5 h-3.5" /> CamGirlFinder
                    </Button>
                  </a>
                  <a href={displayData.urls?.externalProfile} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" className="text-xs gap-1.5 bg-[#C9A84C] hover:bg-[#B8973B] text-black">
                      <ExternalLink className="w-3.5 h-3.5" /> Visit Room
                    </Button>
                  </a>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/[0.03] rounded-lg p-3">
                  <p className="text-[10px] text-[#A8A49A]/40 uppercase tracking-wider mb-0.5">First Seen</p>
                  <p className="text-sm font-medium text-white">
                    {displayData.firstSeen ? format(new Date(displayData.firstSeen), "MMM d, yyyy") : "N/A"}
                  </p>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-3">
                  <p className="text-[10px] text-[#A8A49A]/40 uppercase tracking-wider mb-0.5">Last Seen</p>
                  <p className="text-sm font-medium text-white">
                    {displayData.lastSeen ? format(new Date(displayData.lastSeen), "MMM d, yyyy") : "N/A"}
                  </p>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-3">
                  <p className="text-[10px] text-[#A8A49A]/40 uppercase tracking-wider mb-0.5">Persons</p>
                  <p className="text-sm font-medium text-white">{displayData.persons?.length || 0}</p>
                </div>
                <div className="bg-white/[0.03] rounded-lg p-3">
                  <p className="text-[10px] text-[#A8A49A]/40 uppercase tracking-wider mb-0.5">Total Faces</p>
                  <p className="text-sm font-medium text-white">
                    {displayData.persons?.reduce((sum: number, p: any) => sum + (p.faces || 0), 0) || model.faces || 0}
                  </p>
                </div>
              </div>

              {/* Persons detail */}
              {displayData.persons?.length > 1 && (
                <div className="mt-4">
                  <p className="text-xs text-[#A8A49A]/40 mb-2">Detected Persons</p>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {displayData.persons.map((person: any, i: number) => (
                      <div key={person.person} className="flex items-center gap-2 bg-white/[0.03] rounded-lg p-2 pr-4 shrink-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/40">
                          {person.urls?.faceImage ? (
                            <img src={person.urls.faceImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#A8A49A]/20 text-xs">?</div>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-white font-medium">Person {i + 1}</p>
                          <p className="text-[10px] text-[#A8A49A]/40">{person.faces} faces</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Heatmap */}
      {profile?.schedule && (
        <ModelScheduleHeatmap schedule={profile.schedule} />
      )}

      {/* Similar Models */}
      <ModelSimilarAccounts
        similar={similar}
        loading={loadingSimilar}
        onSelect={onSelectModel}
      />
    </div>
  );
}
