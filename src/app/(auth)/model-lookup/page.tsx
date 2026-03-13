"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import FeatureGate from "@/components/shared/feature-gate";
import ModelLookupSearch from "@/components/modellookup/model-lookup-search";
import ModelLookupProfile from "@/components/modellookup/model-lookup-profile";

export default function ModelLookupPage() {
  const { account, loading: authLoading } = useAuth();
  const [selectedModel, setSelectedModel] = useState<{ site: string; name: string } | null>(null);

  // Auto-search from URL params
  useEffect(() => {
    if (authLoading) return;
    const urlParams = new URLSearchParams(window.location.search);
    const site = urlParams.get("site");
    const name = urlParams.get("name");
    if (site && name) {
      setSelectedModel({ site, name });
    }
  }, [authLoading]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const canAccess = account?.role === "owner" || account?.role === "admin" || account?.role === "operator" || (account?.role === "model" && (account as any)?.works_alone);
  if (!canAccess) {
    return (
      <div className="flex items-center justify-center h-64 text-white/50 text-sm">
        You don&apos;t have access to this page.
      </div>
    );
  }

  return (
    <FeatureGate requiredTier="pro">
      <div className="max-w-7xl mx-auto space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-white">Model Lookup</h2>
          <p className="text-sm text-[#A8A49A]/40 mt-1">
            Search cam models by username — view stats, sessions, tips, top members, chat history, and profile images.
          </p>
        </div>

        <div className="bg-amber-500/[0.06] border border-amber-500/15 rounded-lg px-4 py-2.5">
          <p className="text-xs text-amber-400/70">
            <strong className="text-amber-400">Note:</strong> The tipping data shown here reflects <strong>public tips only</strong> — tips made in the public chat room. Tips from private shows, group shows, and secret tips are not included in these numbers.
          </p>
        </div>

        {!selectedModel ? (
          <ModelLookupSearch onSelect={setSelectedModel} />
        ) : (
          <ModelLookupProfile
            site={selectedModel.site}
            name={selectedModel.name}
            onBack={() => setSelectedModel(null)}
          />
        )}
      </div>
    </FeatureGate>
  );
}
