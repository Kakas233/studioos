"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useCamAccounts } from "@/hooks/use-studio-data";
import { Loader2, Search, UserSearch, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function MemberLookupPage() {
  const { isAdmin } = useAuth();
  const { data: camAccounts = [], isLoading } = useCamAccounts();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchSubmitted, setSearchSubmitted] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchSubmitted(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search Box */}
      <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserSearch className="w-5 h-5 text-[#C9A84C]" />
          <h2 className="text-sm font-medium text-white">Member Lookup</h2>
        </div>
        <p className="text-xs text-[#A8A49A]/40 mb-4">
          Search for a member by their username across all configured cam platforms.
          Enter a username or member ID to look up their activity and spending history.
        </p>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A49A]/40" />
            <Input
              placeholder="Enter member username or ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchSubmitted(false);
              }}
              className="pl-10 bg-[#0A0A0A] border-white/[0.06] text-white placeholder:text-[#A8A49A]/30"
            />
          </div>
          <Button
            type="submit"
            className="bg-[#C9A84C] hover:bg-[#b8963f] text-black font-medium"
            disabled={!searchQuery.trim()}
          >
            Search
          </Button>
        </form>
      </div>

      {/* Search Results */}
      {searchSubmitted && (
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-6">
          <div className="text-center py-8">
            <Search className="w-10 h-10 text-[#A8A49A]/20 mx-auto mb-3" />
            <p className="text-sm text-[#A8A49A]/40 mb-1">
              Member lookup feature coming soon
            </p>
            <p className="text-xs text-[#A8A49A]/25">
              Searched for: &quot;{searchQuery}&quot; -- This feature will search
              across {camAccounts.length} configured cam account{camAccounts.length !== 1 ? "s" : ""} to
              find member activity and spending details.
            </p>
          </div>
        </div>
      )}

      {/* Configured Platforms */}
      <div className="bg-[#111111] border border-white/[0.04] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.04]">
          <p className="text-sm font-medium text-white">
            Configured Platforms ({camAccounts.length})
          </p>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {camAccounts.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#A8A49A]/30">
              No cam accounts configured. Add platform accounts in Settings to enable member lookup.
            </div>
          ) : (
            camAccounts.map((ca) => (
              <div
                key={ca.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center">
                  <ExternalLink className="w-3.5 h-3.5 text-[#A8A49A]/40" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white capitalize">
                    {ca.platform}
                  </p>
                  <p className="text-xs text-[#A8A49A]/40 truncate">
                    {ca.username || ca.id}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
