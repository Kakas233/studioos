"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useStudioAccounts,
  useCamAccounts,
  useStudioDailyStats,
  useStreamingSessions,
} from "@/hooks/use-studio-data";
import { Loader2, Radio, Circle, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function StreamTimePage() {
  const { isAdmin } = useAuth();
  const { data: accounts = [], isLoading: accountsLoading } = useStudioAccounts();
  const { data: camAccounts = [], isLoading: camLoading } = useCamAccounts();

  const modelIds = useMemo(
    () =>
      new Set(
        accounts
          .filter((a) => a.role === "model" && a.is_active)
          .map((a) => a.id)
      ),
    [accounts]
  );

  const camAccountIds = useMemo(
    () => camAccounts.filter((ca) => modelIds.has(ca.model_id)).map((ca) => ca.id),
    [camAccounts, modelIds]
  );

  const { data: dailyStats = [], isLoading: statsLoading } =
    useStudioDailyStats(camAccountIds);
  const { data: sessions = [], isLoading: sessionsLoading } =
    useStreamingSessions(camAccountIds);

  const [selectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  const formatMinutes = (mins: number) => {
    if (!mins) return "0h 0m";
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return `${h}h ${m}m`;
  };

  const todayStats = dailyStats.filter((s) => s.date === selectedDate);
  const totalMinutesToday = todayStats.reduce(
    (sum, s) => sum + (Number(s.total_minutes) || 0),
    0
  );
  const totalPublicMinutes = todayStats.reduce(
    (sum, s) => sum + (Number(s.free_chat_minutes) || 0),
    0
  );
  const totalPrivateMinutes = todayStats.reduce(
    (sum, s) => sum + (Number(s.private_chat_minutes) || 0),
    0
  );

  const activeSessions = sessions.filter((s) => s.is_currently_live);

  const getModelName = (modelId: string | null) => {
    if (!modelId) return "Unknown";
    const acc = accounts.find((a) => a.id === modelId);
    return acc ? `${acc.first_name || ""} ${acc.last_name || ""}`.trim() : "Unknown";
  };

  const getCamAccountModel = (camAccountId: string) => {
    const ca = camAccounts.find((c) => c.id === camAccountId);
    return ca ? getModelName(ca.model_id) : "Unknown";
  };

  const getCamPlatform = (camAccountId: string) => {
    const ca = camAccounts.find((c) => c.id === camAccountId);
    return ca?.platform || "Unknown";
  };

  const isLoading = accountsLoading || camLoading || statsLoading || sessionsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Live Sessions */}
      <div className="bg-[#111111] border border-white/[0.04] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.04] flex items-center gap-2">
          <div className="relative">
            <Radio className="w-4 h-4 text-red-400" />
            {activeSessions.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            )}
          </div>
          <p className="text-sm font-medium text-white">
            Live Now ({activeSessions.length})
          </p>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {activeSessions.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <WifiOff className="w-8 h-8 text-[#A8A49A]/20 mx-auto mb-2" />
              <p className="text-sm text-[#A8A49A]/40">No active streams right now</p>
            </div>
          ) : (
            activeSessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className="relative">
                  <Circle className="w-2.5 h-2.5 fill-emerald-400 text-emerald-400 animate-pulse" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">
                    {getCamAccountModel(session.cam_account_id)}
                  </p>
                  <p className="text-xs text-[#A8A49A]/40">
                    {getCamPlatform(session.cam_account_id)}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                >
                  <Wifi className="w-3 h-3 mr-1" />
                  Live
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-[#A8A49A]/40 mb-1">Total Online Today</p>
          <p className="text-lg sm:text-xl font-semibold text-white">
            {formatMinutes(totalMinutesToday)}
          </p>
        </div>
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-[#A8A49A]/40 mb-1">Public Chat</p>
          <p className="text-lg sm:text-xl font-semibold text-blue-400">
            {formatMinutes(totalPublicMinutes)}
          </p>
        </div>
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-[#A8A49A]/40 mb-1">Private Chat</p>
          <p className="text-lg sm:text-xl font-semibold text-pink-400">
            {formatMinutes(totalPrivateMinutes)}
          </p>
        </div>
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-[#A8A49A]/40 mb-1">Active Models</p>
          <p className="text-lg sm:text-xl font-semibold text-[#C9A84C]">
            {activeSessions.length}
          </p>
        </div>
      </div>

      {/* Daily Stats by Model */}
      <div className="bg-[#111111] border border-white/[0.04] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.04]">
          <p className="text-sm font-medium text-white">
            Today&apos;s Stream Stats by Account
          </p>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {todayStats.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#A8A49A]/30">
              No stream data for today yet.
            </div>
          ) : (
            todayStats.map((stat) => (
              <div
                key={stat.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">
                    {getCamAccountModel(stat.cam_account_id)}
                  </p>
                  <p className="text-xs text-[#A8A49A]/40">
                    {getCamPlatform(stat.cam_account_id)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {formatMinutes(Number(stat.total_minutes) || 0)}
                  </p>
                  <p className="text-[10px] text-[#A8A49A]/30">total online</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
