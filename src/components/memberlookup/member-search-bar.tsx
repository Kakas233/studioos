"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Loader2, X, ArrowRight } from "lucide-react";

const SITES = [
  { value: "chaturbate", label: "Chaturbate", color: "bg-[#F47421]/15 text-[#F47421]" },
  { value: "stripchat", label: "Stripchat", color: "bg-[#A2242D]/15 text-[#A2242D]" },
  { value: "bongacams", label: "Bongacams", color: "bg-[#A02239]/15 text-[#A02239]" },
  { value: "camsoda", label: "Camsoda", color: "bg-[#01B0FA]/15 text-[#01B0FA]" },
  { value: "mfc", label: "MyFreeCams", color: "bg-[#006E00]/15 text-[#006E00]" },
  { value: "livejasmin", label: "LiveJasmin", color: "bg-[#BA0000]/15 text-[#BA0000]" },
];

const SITE_DOT_COLORS: Record<string, string> = {
  chaturbate: "#F47421",
  stripchat: "#A2242D",
  bongacams: "#A02239",
  camsoda: "#01B0FA",
  mfc: "#006E00",
  livejasmin: "#BA0000",
};

interface MemberSearchBarProps {
  onSelect: (member: any) => void;
}

export default function MemberSearchBar({ onSelect }: MemberSearchBarProps) {
  const [query, setQuery] = useState("");
  const [site, setSite] = useState("chaturbate");
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query || query.length < 2) return;
    setLoading(true);
    try {
      const res = await fetch("/api/lookup/member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "info",
          site,
          username: query.trim().toLowerCase(),
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        onSelect({ ...data.data, site, username: data.data.name || query.trim().toLowerCase() });
      } else {
        onSelect({ _notFound: true, username: query.trim().toLowerCase(), site });
      }
    } catch (err) {
      console.error("Member lookup failed:", err);
      onSelect({ _notFound: true, username: query.trim().toLowerCase(), site });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full">
      <Select value={site} onValueChange={(v) => v !== null && setSite(v)}>
        <SelectTrigger className="w-full sm:w-40 h-10 bg-white/[0.03] border-white/[0.06] text-white rounded-xl">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SITES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              <span className="flex items-center gap-2">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: SITE_DOT_COLORS[s.value] }}
                />
                {s.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A49A]/30" />
        <Input
          placeholder="Enter exact member username..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10 h-10 bg-white/[0.03] border-white/[0.06] text-white placeholder:text-[#A8A49A]/30 rounded-xl"
        />
        {query && (
          <button onClick={() => { setQuery(""); onSelect(null); }} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-[#A8A49A]/30 hover:text-white" />
          </button>
        )}
      </div>

      <Button
        onClick={handleSearch}
        disabled={loading || query.length < 2}
        className="h-10 bg-[#C9A84C] hover:bg-[#B8973B] text-black font-medium rounded-xl gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
        Lookup
      </Button>
    </div>
  );
}
