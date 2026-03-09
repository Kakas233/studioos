"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useStudioAccounts, useCamAccounts, useEarnings } from "@/hooks/use-studio-data";
import { useCurrency } from "@/hooks/use-currency";
import { Loader2, Search, UserSearch } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function ModelLookupPage() {
  const { isAdmin } = useAuth();
  const { data: accounts = [], isLoading: accountsLoading } = useStudioAccounts();
  const { data: camAccounts = [], isLoading: camLoading } = useCamAccounts();
  const { data: earnings = [], isLoading: earningsLoading } = useEarnings();
  const { formatUsdShort } = useCurrency();

  const [searchQuery, setSearchQuery] = useState("");

  const models = useMemo(
    () => accounts.filter((a) => a.role === "model"),
    [accounts]
  );

  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return models;
    const q = searchQuery.toLowerCase();
    return models.filter((m) => {
      const name = `${m.first_name || ""} ${m.last_name || ""} ${m.email || ""}`.toLowerCase();
      return name.includes(q);
    });
  }, [models, searchQuery]);

  const getModelCamAccounts = (modelId: string) =>
    camAccounts.filter((ca) => ca.model_id === modelId);

  const getModelEarnings = (modelId: string) =>
    earnings.filter((e) => e.model_id === modelId);

  const isLoading = accountsLoading || camLoading || earningsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A49A]/40" />
        <Input
          placeholder="Search models by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-[#111111] border-white/[0.04] text-white placeholder:text-[#A8A49A]/30"
        />
      </div>

      {/* Results */}
      {filteredModels.length === 0 ? (
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-12 text-center">
          <UserSearch className="w-10 h-10 text-[#A8A49A]/20 mx-auto mb-3" />
          <p className="text-sm text-[#A8A49A]/40">
            {searchQuery ? "No models match your search" : "No models found"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredModels.map((model) => {
            const modelCams = getModelCamAccounts(model.id);
            const modelEarningsList = getModelEarnings(model.id);
            const totalGross = modelEarningsList.reduce(
              (sum, e) => sum + (Number(e.total_gross_usd) || 0),
              0
            );
            const totalModelPay = modelEarningsList.reduce(
              (sum, e) => sum + (Number(e.model_pay_usd) || 0),
              0
            );

            return (
              <div
                key={model.id}
                className="bg-[#111111] border border-white/[0.04] rounded-xl p-4 hover:border-white/[0.08] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center text-sm font-semibold text-white shrink-0">
                    {(model.first_name?.charAt(0) || "?").toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white">
                        {model.first_name || ""} {model.last_name || ""}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-[9px] ${
                          model.is_active
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {model.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-xs text-[#A8A49A]/40">{model.email}</p>

                    {/* Platforms */}
                    {modelCams.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {modelCams.map((ca) => (
                          <span
                            key={ca.id}
                            className="text-[9px] px-2 py-0.5 rounded bg-white/[0.04] text-[#A8A49A]/50 capitalize"
                          >
                            {ca.platform} {ca.username ? `(${ca.username})` : ""}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Earnings Summary */}
                    <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-white/[0.04]">
                      <div>
                        <p className="text-[10px] text-[#A8A49A]/40">Revenue</p>
                        <p className="text-xs font-medium text-white">
                          {formatUsdShort(totalGross)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#A8A49A]/40">Model Pay</p>
                        <p className="text-xs font-medium text-pink-400">
                          {formatUsdShort(totalModelPay)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[#A8A49A]/40">Sessions</p>
                        <p className="text-xs font-medium text-white">
                          {modelEarningsList.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
