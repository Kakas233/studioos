"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Search } from "lucide-react";
import MemberSearchBar from "@/components/memberlookup/member-search-bar";
import MemberProfile from "@/components/memberlookup/member-profile";
import FeatureGate from "@/components/shared/feature-gate";
import DataAvailabilityTooltip from "@/components/shared/data-availability-tooltip";

export default function MemberLookupPage() {
  const { account, loading: authLoading } = useAuth();
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const autoSearched = useRef(false);

  // Auto-search from URL params
  useEffect(() => {
    if (authLoading || autoSearched.current) return;
    const urlParams = new URLSearchParams(window.location.search);
    const site = urlParams.get("site");
    const username = urlParams.get("username");
    if (site && username) {
      autoSearched.current = true;
      (async () => {
        try {
          const res = await fetch("/api/lookup/member", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "info",
              site,
              username: username.toLowerCase(),
            }),
          });
          const data = await res.json();
          if (data.success && data.data) {
            setSelectedMember({ ...data.data, site, username: data.data.name || username.toLowerCase() });
          } else {
            setSelectedMember({ _notFound: true, username: username.toLowerCase(), site });
          }
        } catch {
          setSelectedMember({ _notFound: true, username: username.toLowerCase(), site });
        }
      })();
    }
  }, [authLoading]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <FeatureGate requiredTier="pro">
    <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">Member Lookup <DataAvailabilityTooltip /></h2>
      </div>
      <p className="text-sm text-[#A8A49A]/40 -mt-3">
        Search cam site members by username to view their tipping stats, history, and activity across MyFreeCams, Camsoda, Chaturbate, Stripchat, Bongacams, and LiveJasmin.
      </p>
      <div className="bg-amber-500/[0.06] border border-amber-500/15 rounded-lg px-4 py-2.5 -mt-1">
        <p className="text-xs text-amber-400/70">
          <strong className="text-amber-400">Note:</strong> The tipping data shown here reflects <strong>public tips only</strong> — tips made in the public chat room. Tips from private shows, group shows, and secret tips are not included in these numbers.
        </p>
      </div>

      {/* Search */}
      <MemberSearchBar onSelect={setSelectedMember} />

      {/* Profile, not found, or empty state */}
      {selectedMember && selectedMember._notFound ? (
        <div className="bg-[#111111] border border-red-500/10 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-red-500/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-7 h-7 text-red-400/40" />
          </div>
          <p className="text-white/70 text-sm font-medium">Member &quot;{selectedMember.username}&quot; not found</p>
          <p className="text-[#A8A49A]/30 text-xs mt-2">
            No data exists for this username on {selectedMember.site}. Check the spelling or try a different platform.
          </p>
        </div>
      ) : selectedMember ? (
        <MemberProfile member={selectedMember} />
      ) : (
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-white/[0.03] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-7 h-7 text-[#A8A49A]/20" />
          </div>
          <p className="text-[#A8A49A]/40 text-sm">Enter a member username and select the platform to look them up</p>
          <p className="text-[#A8A49A]/20 text-xs mt-2">
            Chaturbate, Stripchat, Bongacams, Camsoda, MyFreeCams, LiveJasmin
          </p>
        </div>
      )}
    </div>
    </FeatureGate>
  );
}
