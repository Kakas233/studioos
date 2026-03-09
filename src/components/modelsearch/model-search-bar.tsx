"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Loader2, X, ArrowRight } from "lucide-react";

const PLATFORMS = [
  { value: "all", label: "All Platforms", color: "#C9A84C" },
  { value: "mfc", label: "MyFreeCams", color: "#006E00" },
  { value: "cb", label: "Chaturbate", color: "#F47421" },
  { value: "sc", label: "StripChat", color: "#A2242D" },
  { value: "bc", label: "BongaCams", color: "#A02239" },
  { value: "cs", label: "CamSoda", color: "#01B0FA" },
  { value: "lj", label: "LiveJasmin", color: "#BA0000" },
  { value: "f4f", label: "Flirt4Free", color: "#00AEEF" },
  { value: "c4", label: "Cam4", color: "#FF6B00" },
  { value: "sm", label: "Streamate", color: "#c73d7d" },
];

interface ModelSearchBarProps {
  onResults: (results: any[] | null) => void;
  onLoading: (loading: boolean) => void;
}

export default function ModelSearchBar({ onResults, onLoading }: ModelSearchBarProps) {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState("all");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query || query.length < 3) return;
    setLoading(true);
    onLoading?.(true);
    try {
      const params: any = { action: "search", searchText: query.trim() };
      if (platform !== "all") params.platform = platform;

      const res = await fetch("/api/lookup/model-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (data.success) {
        onResults(data.results || []);
      } else {
        onResults([]);
      }
    } catch (err) {
      console.error("Model search failed:", err);
      onResults([]);
    } finally {
      setLoading(false);
      onLoading?.(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full">
      <Select value={platform} onValueChange={(v) => v !== null && setPlatform(v)}>
        <SelectTrigger className="w-full sm:w-44 h-10 bg-white/[0.03] border-white/[0.06] text-white rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PLATFORMS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              <span className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                {p.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A49A]/30" />
        <Input
          placeholder="Search model name (min 3 characters)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="pl-10 pr-10 h-10 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-[#A8A49A]/30 rounded-xl"
        />
        {query && (
          <button onClick={() => { setQuery(""); onResults(null); }} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-[#A8A49A]/30 hover:text-white" />
          </button>
        )}
      </div>

      <Button
        onClick={handleSearch}
        disabled={loading || query.length < 3}
        className="h-10 bg-[#C9A84C] hover:bg-[#B8973B] text-black font-medium rounded-xl gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
        Search
      </Button>
    </div>
  );
}
