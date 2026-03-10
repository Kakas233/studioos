"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useShifts,
  useEarnings,
  useStudioAccounts,
  useChangeRequests,
  useCamAccounts,
  useStudioDailyStats,
  useStreamingSessions,
} from "@/hooks/use-studio-data";
import { useCurrency } from "@/hooks/use-currency";
import { parseISO, isWithinInterval, startOfMonth, endOfMonth, subDays } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import StudioHeader from "@/components/dashboard/studio-header";
import DateRangeSelector from "@/components/dashboard/date-range-selector";
import StatsCard from "@/components/dashboard/stats-card";
import RevenueChart from "@/components/dashboard/revenue-chart";
import PendingApprovals from "@/components/dashboard/pending-approvals";
import LiveStatus from "@/components/streamtime/live-status";
import OperatorAgenda from "@/components/dashboard/operator-agenda";
import WeeklyGoal from "@/components/dashboard/weekly-goal";
import OnboardingGuide from "@/components/onboarding/onboarding-guide";
import type { Database } from "@/lib/supabase/types";

type Earning = Database["public"]["Tables"]["earnings"]["Row"];
type Shift = Database["public"]["Tables"]["shifts"]["Row"];

const supabase = createClient();

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const { account, studio, loading: authLoading, isAdmin, role } = useAuth();

  const now = new Date();
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(now),
    end: endOfMonth(now),
  });

  const userRole = role || "owner";
  const isAccountant = userRole === "accountant";
  const { formatUsdShort, formatSecondary, secondaryCurrencyCode } = useCurrency();

  const { data: shifts = [] } = useShifts();
  const { data: earnings = [] } = useEarnings();
  const { data: accounts = [] } = useStudioAccounts();
  const { data: changeRequests = [] } = useChangeRequests();
  const { data: camAccounts = [] } = useCamAccounts();

  // Build set of cam account IDs that belong to this studio's active models
  const studioModelIds = useMemo(
    () => new Set(accounts.filter((a) => a.role === "model" && a.is_active !== false).map((a) => a.id)),
    [accounts]
  );
  const studioModels = useMemo(
    () => accounts.filter((a) => a.role === "model" && a.is_active !== false),
    [accounts]
  );
  const studioCamAccounts = useMemo(
    () => camAccounts.filter((ca) => studioModelIds.has(ca.model_id)),
    [camAccounts, studioModelIds]
  );
  const studioCamAccountIds = useMemo(
    () => studioCamAccounts.map((ca) => ca.id),
    [studioCamAccounts]
  );

  // Fetch daily stream stats scoped to this studio's cam accounts
  const { data: dailyStats = [] } = useStudioDailyStats(studioCamAccountIds);

  // Fetch live sessions for LiveStatus
  const { data: studioSessions = [] } = useStreamingSessions(studioCamAccountIds);

  // Mutations for change requests
  const updateEarningMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      await supabase.from("earnings").update(data).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["earnings"] }),
  });
  const createEarningMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      await supabase.from("earnings").insert(data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["earnings"] }),
  });
  const updateShiftMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      await supabase.from("shifts").update(data).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shifts"] }),
  });
  const updateChangeRequestMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      await supabase.from("shift_change_requests").update(data).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["shiftChangeRequests"] }),
  });

  const handleApproveChange = async (request: Database["public"]["Tables"]["shift_change_requests"]["Row"]) => {
    const existingEarning = earnings.find((e) => e.shift_id === request.shift_id);
    if (existingEarning) {
      await updateEarningMutation.mutateAsync({ id: existingEarning.id, data: request.new_data as Record<string, unknown> });
    } else {
      await createEarningMutation.mutateAsync(request.new_data as Record<string, unknown>);
    }
    await updateShiftMutation.mutateAsync({ id: request.shift_id, data: { status: "completed" } });
    await updateChangeRequestMutation.mutateAsync({ id: request.id, data: { status: "approved" } });
    toast.success("Change request approved");
  };

  const handleRejectChange = async (request: Database["public"]["Tables"]["shift_change_requests"]["Row"]) => {
    await updateShiftMutation.mutateAsync({ id: request.shift_id, data: { status: "completed" } });
    await updateChangeRequestMutation.mutateAsync({ id: request.id, data: { status: "rejected" } });
    toast.success("Change request rejected");
  };

  if (authLoading || !account) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Helpers
  const filterByDate = <T extends Record<string, unknown>>(items: T[], dateField = "shift_date") => {
    return items.filter((item) => {
      const d = item[dateField] as string | undefined;
      if (!d) return false;
      try {
        const date = parseISO(d);
        return isWithinInterval(date, { start: dateRange.start, end: dateRange.end });
      } catch { return false; }
    });
  };

  const formatMinutes = (mins: number) => {
    if (!mins) return "0h";
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // Role-based filtering
  const filteredShifts = shifts.filter((shift: Shift) => {
    if (isAdmin || isAccountant) return true;
    if (userRole === "operator") return shift.operator_id === account.id;
    if (userRole === "model") return shift.model_id === account.id;
    return false;
  });

  const filteredEarnings = earnings.filter((earning: Earning) => {
    if (isAdmin || isAccountant) return true;
    if (userRole === "model") return earning.model_id === account.id;
    if (userRole === "operator") return earning.operator_id === account.id;
    return false;
  });

  // Period earnings
  const rangeEarnings = filterByDate(filteredEarnings);
  const prevStart = subDays(dateRange.start, Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
  const prevEnd = subDays(dateRange.start, 1);
  const prevRangeEarnings = filteredEarnings.filter((e: Earning) => {
    if (!e.shift_date) return false;
    try {
      return isWithinInterval(parseISO(e.shift_date), { start: prevStart, end: prevEnd });
    } catch { return false; }
  });

  const calcChange = (curr: number, prev: number) => {
    if (!prev || prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  const totalGrossUsd = rangeEarnings.reduce((s: number, e) => s + (Number((e as Earning).total_gross_usd) || 0), 0);
  const prevGrossUsd = prevRangeEarnings.reduce((s: number, e: Earning) => s + (Number(e.total_gross_usd) || 0), 0);
  const totalModelPayUsd = rangeEarnings.reduce((s: number, e) => s + (Number((e as Earning).model_pay_usd) || 0), 0);
  const prevModelPayUsd = prevRangeEarnings.reduce((s: number, e: Earning) => s + (Number(e.model_pay_usd) || 0), 0);
  const totalOperatorPayUsd = rangeEarnings.reduce((s: number, e) => s + (Number((e as Earning).operator_pay_usd) || 0), 0);
  const prevOperatorPayUsd = prevRangeEarnings.reduce((s: number, e: Earning) => s + (Number(e.operator_pay_usd) || 0), 0);

  const completedShifts = filteredShifts.filter((s: Shift) => s.status === "completed").length;
  const scheduledShifts = filteredShifts.filter((s: Shift) => s.status === "scheduled").length;

  // Stream stats in range
  const rangeStats = dailyStats.filter((s) => {
    if (!s.date) return false;
    if (userRole === "model" && s.model_id !== account.id) return false;
    if (userRole === "operator") {
      const operatorModelIds = new Set(
        shifts.filter((sh) => sh.operator_id === account.id).map((sh) => sh.model_id)
      );
      if (!operatorModelIds.has(s.model_id)) return false;
    }
    try { return isWithinInterval(parseISO(s.date), { start: dateRange.start, end: dateRange.end }); }
    catch { return false; }
  });
  const totalPublicMins = rangeStats.reduce((s, d) => s + (Number(d.free_chat_minutes) || 0), 0);
  const totalPrivateMins = rangeStats.reduce((s, d) => s + (Number(d.private_chat_minutes) || 0), 0);
  const totalGroupMins = rangeStats.reduce((s, d) => s + (Number(d.group_chat_minutes) || 0), 0);
  const totalOnlineMins = rangeStats.reduce((s, d) => s + (Number(d.total_minutes) || 0), 0);

  const fmtUsd = (v: number) => formatUsdShort(v);

  // ─── ACCOUNTANT ───
  if (isAccountant) {
    return (
      <div className="space-y-5">
        <OnboardingGuide />
        <DateRangeSelector dateRange={dateRange} setDateRange={setDateRange} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard title="Total Revenue" value={fmtUsd(totalGrossUsd)} change={calcChange(totalGrossUsd, prevGrossUsd)} changeLabel="vs prev" />
          <StatsCard title="Model Payouts" value={fmtUsd(totalModelPayUsd)} change={calcChange(totalModelPayUsd, prevModelPayUsd)} changeLabel="vs prev" />
          <StatsCard title="Operator Payouts" value={fmtUsd(totalOperatorPayUsd)} change={calcChange(totalOperatorPayUsd, prevOperatorPayUsd)} changeLabel="vs prev" />
          <StatsCard title="Sessions" value={rangeEarnings.length} change={0} />
        </div>
        <RevenueChart earnings={rangeEarnings as Earning[]} dateRange={dateRange} />
      </div>
    );
  }

  // ─── ADMIN / OWNER ───
  if (isAdmin) {
    return (
      <div className="space-y-5">
        <OnboardingGuide />
        <StudioHeader studio={studio} accounts={accounts} />
        <DateRangeSelector dateRange={dateRange} setDateRange={setDateRange} />

        <PendingApprovals changeRequests={changeRequests} onApprove={handleApproveChange} onReject={handleRejectChange} />

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
          <StatsCard title="Total Revenue" value={fmtUsd(totalGrossUsd)} change={calcChange(totalGrossUsd, prevGrossUsd)} changeLabel="vs prev" />
          <StatsCard title="Model Payouts" value={fmtUsd(totalModelPayUsd)} change={calcChange(totalModelPayUsd, prevModelPayUsd)} changeLabel="vs prev" />
          <StatsCard title="Operator Payouts" value={fmtUsd(totalOperatorPayUsd)} change={calcChange(totalOperatorPayUsd, prevOperatorPayUsd)} changeLabel="vs prev" />
          <StatsCard title="Completed" value={completedShifts} change={0} />
          <StatsCard title="Scheduled" value={scheduledShifts} change={0} />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <StatsCard title="Total Online" value={formatMinutes(totalOnlineMins)} change={0} />
          <StatsCard title="Public Shows" value={formatMinutes(totalPublicMins)} change={0} />
          <StatsCard title="Private Shows" value={formatMinutes(totalPrivateMins)} change={0} />
          <StatsCard title="Group Shows" value={formatMinutes(totalGroupMins)} change={0} />
        </div>

        <RevenueChart earnings={rangeEarnings as Earning[]} dateRange={dateRange} />

        <div className="grid grid-cols-1 gap-4 sm:gap-5">
          <OperatorAgenda shifts={filteredShifts} />
          <LiveStatus sessions={studioSessions} camAccounts={studioCamAccounts} models={studioModels} />
        </div>
      </div>
    );
  }

  // ─── OPERATOR ───
  if (userRole === "operator") {
    const todaySessions = filteredShifts.filter((s: Shift) => {
      try { return parseISO(s.start_time).toDateString() === now.toDateString(); } catch { return false; }
    }).length;

    return (
      <div className="space-y-5">
        <OnboardingGuide />
        <DateRangeSelector dateRange={dateRange} setDateRange={setDateRange} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard title="My Sessions Today" value={todaySessions} change={0} />
          <StatsCard title="Completed" value={completedShifts} change={0} />
          <StatsCard title="Scheduled" value={scheduledShifts} change={0} />
          <StatsCard title="Total Earnings" value={fmtUsd(totalGrossUsd)} change={calcChange(totalGrossUsd, prevGrossUsd)} changeLabel="vs prev" />
        </div>

        {totalOnlineMins > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatsCard title="Total Online" value={formatMinutes(totalOnlineMins)} change={0} />
            <StatsCard title="Public Shows" value={formatMinutes(totalPublicMins)} change={0} />
            <StatsCard title="Private Shows" value={formatMinutes(totalPrivateMins)} change={0} />
            <StatsCard title="Group Shows" value={formatMinutes(totalGroupMins)} change={0} />
          </div>
        )}

        <RevenueChart earnings={rangeEarnings as Earning[]} dateRange={dateRange} />
        <OperatorAgenda shifts={filteredShifts} />
      </div>
    );
  }

  // ─── MODEL ───
  if (userRole === "model") {
    const modelPayUsd = rangeEarnings.reduce((s: number, e) => s + (Number((e as Earning).model_pay_usd) || 0), 0);
    const prevModelPay = prevRangeEarnings.filter((e: Earning) => e.model_id === account.id).reduce((s: number, e: Earning) => s + (Number(e.model_pay_usd) || 0), 0);

    return (
      <div className="space-y-5">
        <OnboardingGuide />
        <DateRangeSelector dateRange={dateRange} setDateRange={setDateRange} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatsCard title="My Earnings" value={fmtUsd(modelPayUsd)} change={calcChange(modelPayUsd, prevModelPay)} changeLabel="vs prev" />
          <StatsCard title="Completed" value={completedShifts} change={0} />
          <StatsCard title="Scheduled" value={scheduledShifts} change={0} />
          <StatsCard title="Sessions This Period" value={rangeEarnings.length} change={0} />
        </div>

        {totalOnlineMins > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatsCard title="Total Online" value={formatMinutes(totalOnlineMins)} change={0} />
            <StatsCard title="Public Shows" value={formatMinutes(totalPublicMins)} change={0} />
            <StatsCard title="Private Shows" value={formatMinutes(totalPrivateMins)} change={0} />
            <StatsCard title="Group Shows" value={formatMinutes(totalGroupMins)} change={0} />
          </div>
        )}

        <RevenueChart earnings={rangeEarnings as Earning[]} dateRange={dateRange} />
        {(Boolean(account.weekly_goal_enabled) !== false) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <WeeklyGoal shifts={filteredShifts} targetHours={Number(account.weekly_goal_hours) || 20} enabled={Boolean(account.weekly_goal_enabled)} />
            <OperatorAgenda shifts={filteredShifts} />
          </div>
        )}
        {Boolean(account.weekly_goal_enabled) === false && (
          <OperatorAgenda shifts={filteredShifts} />
        )}
      </div>
    );
  }

  return null;
}
