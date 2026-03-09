"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { Search } from "lucide-react";
import FeatureGate from "@/components/shared/feature-gate";
import ModelSearchBar from "@/components/modelsearch/model-search-bar";
import ModelSearchResults from "@/components/modelsearch/model-search-results";
import ModelProfileView from "@/components/modelsearch/model-profile-view";

export default function ModelSearchPage() {
  const { loading: authLoading } = useAuth();
  const [results, setResults] = useState<any[] | null>(null);
  const [selectedModel, setSelectedModel] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleSelectModel = (model: any) => {
    setSelectedModel(model);
  };

  const handleBack = () => {
    setSelectedModel(null);
  };

  return (
    <FeatureGate requiredTier="elite">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div>
          <h2 className="text-xl font-semibold text-white">Model Lookup</h2>
          <p className="text-sm text-[#A8A49A]/40 mt-1">
            Search cam models by username across all major platforms. View profiles, schedules, and similar accounts.
          </p>
        </div>

        <div className="bg-blue-500/[0.06] border border-blue-500/15 rounded-lg px-4 py-2.5">
          <p className="text-xs text-blue-400/70">
            <strong className="text-blue-400">Powered by CamGirlFinder</strong> — Search models, view detected persons, online schedules, and find similar accounts across platforms.
          </p>
        </div>

        {/* Search */}
        {!selectedModel && (
          <>
            <ModelSearchBar onResults={setResults} onLoading={setSearching} />

            {searching && (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!searching && results !== null && (
              <ModelSearchResults results={results} onSelect={handleSelectModel} />
            )}

            {!searching && results === null && (
              <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-12 text-center">
                <div className="w-16 h-16 bg-white/[0.03] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Search className="w-7 h-7 text-[#A8A49A]/20" />
                </div>
                <p className="text-[#A8A49A]/40 text-sm">Enter a model name to search across all cam platforms</p>
                <p className="text-[#A8A49A]/20 text-xs mt-2">
                  Minimum 3 characters · Supports MyFreeCams, Chaturbate, StripChat, BongaCams, CamSoda, LiveJasmin, and more
                </p>
              </div>
            )}
          </>
        )}

        {/* Profile View */}
        {selectedModel && (
          <ModelProfileView
            model={selectedModel}
            onBack={handleBack}
            onSelectModel={handleSelectModel}
          />
        )}
      </div>
    </FeatureGate>
  );
}
