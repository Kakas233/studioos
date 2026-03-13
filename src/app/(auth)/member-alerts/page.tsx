"use client";

import { useAuth } from "@/lib/auth/auth-context";
import TelegramConnection from "@/components/memberalerts/telegram-connection";
import RoomMemberAlerts from "@/components/memberalerts/room-member-alerts";
import FeatureGate from "@/components/shared/feature-gate";
import DataAvailabilityTooltip from "@/components/shared/data-availability-tooltip";

export default function MemberAlertsPage() {
  const { account, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const accountId = account?.id;
  const studioId = account?.studio_id;

  return (
    <FeatureGate requiredTier="elite">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">Member Alerts <DataAvailabilityTooltip /></h2>
        </div>
        <p className="text-sm text-[#A8A49A]/40 -mt-3">
          Get real-time Telegram alerts when high-spending members enter your monitored rooms.
        </p>

        {/* Telegram Connection */}
        <TelegramConnection accountId={accountId} studioId={studioId} />

        {/* Room Member Alerts */}
        <RoomMemberAlerts accountId={accountId} studioId={studioId} />
      </div>
    </FeatureGate>
  );
}
