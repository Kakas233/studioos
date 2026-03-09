"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight, X } from "lucide-react";

const SITES = [
  { value: "chaturbate", label: "Chaturbate", color: "#F47421" },
  { value: "stripchat", label: "StripChat", color: "#A2242D" },
  { value: "bongacams", label: "BongaCams", color: "#A02239" },
  { value: "camsoda", label: "CamSoda", color: "#01B0FA" },
  { value: "mfc", label: "MyFreeCams", color: "#006E00" },
  { value: "livejasmin", label: "LiveJasmin", color: "#BA0000" },
];

interface ModelLookupSearchProps {
  onSelect: (model: { site: string; name: string }) => void;
}

export default function ModelLookupSearch({ onSelect }: ModelLookupSearchProps) {
  const [site, setSite] = useState("chaturbate");
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    if (!query.trim()) return;
    onSelect({ site, name: query.trim() });
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2">
        <Select value={site} onValueChange={(v) => v !== null && setSite(v)}>
          <SelectTrigger className="w-full sm:w-44 h-10 bg-white/[0.03] border-white/[0.06] text-white rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SITES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A49A]/30" />
          <Input
            placeholder="Enter model username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-10 pr-10 h-10 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-[#A8A49A]/30 rounded-xl"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-[#A8A49A]/30 hover:text-white" />
            </button>
          )}
        </div>

        <Button
          onClick={handleSearch}
          disabled={!query.trim()}
          className="h-10 bg-[#C9A84C] hover:bg-[#B8973B] text-black font-medium rounded-xl gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          Search
        </Button>
      </div>

      <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-12 text-center">
        <div className="w-16 h-16 bg-white/[0.03] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Search className="w-7 h-7 text-[#A8A49A]/20" />
        </div>
        <p className="text-[#A8A49A]/40 text-sm">Enter a model username and select the platform to look them up</p>
        <p className="text-[#A8A49A]/20 text-xs mt-2">
          View stats, sessions, tips, top members, chat, and profile · Chaturbate, StripChat, BongaCams, CamSoda, MyFreeCams, LiveJasmin
        </p>
      </div>
    </>
  );
}
