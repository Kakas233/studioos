"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useStudioAccounts,
  useEarnings,
  useShifts,
  useCamAccounts,
  useStudioDailyStats,
} from "@/hooks/use-studio-data";
import { useCurrency } from "@/hooks/use-currency";
import { Loader2, BarChart3 } from "lucide-react";

export default function ModelInsightsPage() {
  const { isAdmin } = useAuth();
  const { data: accounts = [], isLoading: accountsLoading } = useStudioAccounts();
  const { data: earnings = [], isLoading: earningsLoading } = useEarnings();
  const { data: shifts = [], isLoading: shiftsLoading } = useShifts();
  const { data: camAccounts = [], isLoading: camLoading } = useCamAccounts();
  const { formatUsdShort } = useCurrency();

  const models = useMemo(
    () => accounts.filter((a) => a.role === "model" && a.is_active),
    [accounts]
  );

  const camAccountIds = useMemo(
    () =>
      camAccounts
        .filter((ca) => models.some((m) => m.id === ca.model_id))
        .map((ca) => ca.id),
    [camAccounts, models]
  );

  const { data: dailyStats = [], isLoading: statsLoading } =
    useStudioDailyStats(camAccountIds);

  const modelInsights = useMemo(() => {
    return models.map((model) => {
      const modelEarnings = earnings.filter((e) => e.model_id === model.id);
      const modelShifts = shifts.filter((s) => s.model_id === model.id);
      const modelCamIds = camAccounts
        .filter((ca) => ca.model_id === model.id)
        .map((ca) => ca.id);
      const modelStats = dailyStats.filter((s) =>
        modelCamIds.includes(s.cam_account_id)
      );

      const totalGross = modelEarnings.reduce(
        (sum, e) => sum + (Number(e.total_gross_usd) || 0),
        0
      );
      const totalModelPay = modelEarnings.reduce(
        (sum, e) => sum + (Number(e.model_pay_usd) || 0),
        0
      );
      const completedShifts = modelShifts.filter(
        (s) => s.status === "completed"
      ).length;
      const totalOnlineMinutes = modelStats.reduce(
        (sum, s) => sum + (Number(s.total_minutes) || 0),
        0
      );
      const avgPerSession =
        modelEarnings.length > 0 ? totalGross / modelEarnings.length : 0;

      return {
        id: model.id,
        name: `${model.first_name || ""} ${model.last_name || ""}`.trim(),
        totalGross,
        totalModelPay,
        completedShifts,
        totalSessions: modelEarnings.length,
        totalOnlineMinutes,
        avgPerSession,
        platforms: [...new Set(camAccounts.filter((ca) => ca.model_id === model.id).map((ca) => ca.platform))],
      };
    });
  }, [models, earnings, shifts, camAccounts, dailyStats]);

  const sortedModels = [...modelInsights].sort(
    (a, b) => b.totalGross - a.totalGross
  );

  const formatMinutes = (mins: number) => {
    if (!mins) return "0h";
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const isLoading =
    accountsLoading || earningsLoading || shiftsLoading || camLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-[#A8A49A]/40 mb-1">Active Models</p>
          <p className="text-lg sm:text-xl font-semibold text-white">{models.length}</p>
        </div>
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-[#A8A49A]/40 mb-1">Total Revenue</p>
          <p className="text-lg sm:text-xl font-semibold text-[#C9A84C]">
            {formatUsdShort(
              modelInsights.reduce((sum, m) => sum + m.totalGross, 0)
            )}
          </p>
        </div>
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-[#A8A49A]/40 mb-1">Total Sessions</p>
          <p className="text-lg sm:text-xl font-semibold text-white">
            {modelInsights.reduce((sum, m) => sum + m.totalSessions, 0)}
          </p>
        </div>
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-[#A8A49A]/40 mb-1">Total Stream Time</p>
          <p className="text-lg sm:text-xl font-semibold text-white">
            {formatMinutes(
              modelInsights.reduce((sum, m) => sum + m.totalOnlineMinutes, 0)
            )}
          </p>
        </div>
      </div>

      {/* Model Cards */}
      {sortedModels.length === 0 ? (
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-12 text-center">
          <BarChart3 className="w-10 h-10 text-[#A8A49A]/20 mx-auto mb-3" />
          <p className="text-sm text-[#A8A49A]/40">No model data available</p>
          <p className="text-xs text-[#A8A49A]/25 mt-1">
            Model insights will appear once models have recorded sessions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {sortedModels.map((model, index) => (
            <div
              key={model.id}
              className="bg-[#111111] border border-white/[0.04] rounded-xl p-4 hover:border-white/[0.08] transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center text-sm font-semibold text-white">
                    {model.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{model.name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {model.platforms.map((platform) => (
                        <span
                          key={platform}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-[#A8A49A]/50"
                        >
                          {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-[#A8A49A]/30 font-mono">
                  #{index + 1}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-[10px] text-[#A8A49A]/40 mb-0.5">Revenue</p>
                  <p className="text-sm font-semibold text-white">
                    {formatUsdShort(model.totalGross)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#A8A49A]/40 mb-0.5">Model Pay</p>
                  <p className="text-sm font-semibold text-pink-400">
                    {formatUsdShort(model.totalModelPay)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#A8A49A]/40 mb-0.5">Sessions</p>
                  <p className="text-sm font-semibold text-white">
                    {model.totalSessions}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#A8A49A]/40 mb-0.5">Avg/Session</p>
                  <p className="text-sm font-semibold text-[#C9A84C]">
                    {formatUsdShort(model.avgPerSession)}
                  </p>
                </div>
              </div>

              {model.totalOnlineMinutes > 0 && (
                <div className="mt-3 pt-3 border-t border-white/[0.04]">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-[#A8A49A]/40">
                      Stream Time: {formatMinutes(model.totalOnlineMinutes)}
                    </p>
                    <p className="text-[10px] text-[#A8A49A]/40">
                      Completed Shifts: {model.completedShifts}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
