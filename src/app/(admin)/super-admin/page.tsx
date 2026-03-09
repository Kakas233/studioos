"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Building2,
  Users,
  DollarSign,
  AlertTriangle,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  BarChart3,
  Shield,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface OverviewData {
  totalStudios: number;
  totalAccounts: number;
  activeAccounts: number;
  totalRevenue: number;
  errorCount: number;
  totalErrors: number;
  tierBreakdown: Record<string, number>;
}

interface StudioRow {
  id: string;
  name: string;
  subdomain: string;
  subscription_tier: string;
  subscription_status: string;
  model_limit: number;
  current_model_count: number;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
  account_counts: {
    total: number;
    active: number;
    models: number;
  };
}

interface ErrorRow {
  id: string;
  studio_id: string | null;
  error_type: string;
  message: string;
  stack_trace: string | null;
  url: string | null;
  user_agent: string | null;
  account_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface ErrorsResponse {
  errors: ErrorRow[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  errorTypes: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function tierColor(tier: string): string {
  switch (tier) {
    case "elite":
      return "bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/20";
    case "pro":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "starter":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    default:
      return "bg-white/5 text-[#A8A49A]/60 border-white/[0.08]";
  }
}

function statusColor(status: string): string {
  switch (status) {
    case "active":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "trialing":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "past_due":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "cancelled":
    case "suspended":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    default:
      return "bg-white/5 text-[#A8A49A]/60 border-white/[0.08]";
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SuperAdminPage() {
  const router = useRouter();

  // Auth check
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  // Overview state
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Studios state
  const [studios, setStudios] = useState<StudioRow[]>([]);
  const [studiosLoading, setStudiosLoading] = useState(true);
  const [studioSearch, setStudioSearch] = useState("");

  // Errors state
  const [errorsData, setErrorsData] = useState<ErrorsResponse | null>(null);
  const [errorsLoading, setErrorsLoading] = useState(true);
  const [errorPage, setErrorPage] = useState(1);
  const [errorTypeFilter, setErrorTypeFilter] = useState("");

  // ─── Auth check on mount ─────────────────────────────────────────────────

  useEffect(() => {
    async function checkAccess() {
      try {
        const res = await fetch("/api/admin");
        if (res.ok) {
          const data = await res.json();
          setOverview(data);
          setAuthorized(true);
        } else {
          setAuthorized(false);
          router.replace("/dashboard");
        }
      } catch {
        setAuthorized(false);
        router.replace("/dashboard");
      } finally {
        setOverviewLoading(false);
      }
    }
    checkAccess();
  }, [router]);

  // ─── Data fetching ───────────────────────────────────────────────────────

  const fetchStudios = useCallback(async () => {
    setStudiosLoading(true);
    try {
      const res = await fetch("/api/admin/studios");
      if (res.ok) {
        const data = await res.json();
        setStudios(data);
      }
    } catch {
      // silently fail
    } finally {
      setStudiosLoading(false);
    }
  }, []);

  const fetchErrors = useCallback(async () => {
    setErrorsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(errorPage),
        limit: "25",
      });
      if (errorTypeFilter) params.set("error_type", errorTypeFilter);

      const res = await fetch(`/api/admin/errors?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setErrorsData(data);
      }
    } catch {
      // silently fail
    } finally {
      setErrorsLoading(false);
    }
  }, [errorPage, errorTypeFilter]);

  const refreshOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const res = await fetch("/api/admin");
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }
    } catch {
      // silently fail
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  // Fetch studios when authorized
  useEffect(() => {
    if (authorized) fetchStudios();
  }, [authorized, fetchStudios]);

  // Fetch errors when authorized or pagination/filter changes
  useEffect(() => {
    if (authorized) fetchErrors();
  }, [authorized, fetchErrors]);

  // ─── Loading / Unauthorized states ───────────────────────────────────────

  if (authorized === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[#A8A49A]/40">Redirecting...</p>
      </div>
    );
  }

  // ─── Filtered studios ────────────────────────────────────────────────────

  const filteredStudios = studios.filter(
    (s) =>
      s.name.toLowerCase().includes(studioSearch.toLowerCase()) ||
      s.subdomain.toLowerCase().includes(studioSearch.toLowerCase())
  );

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-[#C9A84C]" />
        <div>
          <h1 className="text-lg font-semibold text-white">
            Platform Overview
          </h1>
          <p className="text-xs text-[#A8A49A]/40">
            Cross-studio analytics and error monitoring
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={0}>
        <TabsList className="bg-[#111111] border border-white/[0.04]">
          <TabsTrigger value={0}>Overview</TabsTrigger>
          <TabsTrigger value={1}>Studios</TabsTrigger>
          <TabsTrigger value={2}>Error Logs</TabsTrigger>
        </TabsList>

        {/* ─── Overview Tab ─────────────────────────────────────────────── */}
        <TabsContent value={0}>
          <div className="space-y-5 pt-4">
            {/* Refresh button */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshOverview}
                disabled={overviewLoading}
                className="border-white/[0.08] text-[#A8A49A]/60 hover:text-white bg-transparent"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 mr-1.5 ${overviewLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>

            {/* Stats Cards */}
            {overview && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatsCard
                    icon={
                      <Building2 className="h-4 w-4 text-[#C9A84C]" />
                    }
                    label="Total Studios"
                    value={overview.totalStudios}
                  />
                  <StatsCard
                    icon={<Users className="h-4 w-4 text-blue-400" />}
                    label="Total Accounts"
                    value={overview.totalAccounts}
                    sub={`${overview.activeAccounts} active`}
                  />
                  <StatsCard
                    icon={
                      <DollarSign className="h-4 w-4 text-emerald-400" />
                    }
                    label="Total Revenue"
                    value={formatCurrency(overview.totalRevenue)}
                  />
                  <StatsCard
                    icon={
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                    }
                    label="Errors (30d)"
                    value={overview.errorCount}
                    sub={`${overview.totalErrors} all time`}
                  />
                </div>

                {/* Tier Breakdown */}
                <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="h-4 w-4 text-[#C9A84C]" />
                    <h3 className="text-sm font-medium text-white">
                      Studios by Tier
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {["free", "starter", "pro", "elite"].map((tier) => (
                      <div
                        key={tier}
                        className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-3 text-center"
                      >
                        <p className="text-xl font-semibold text-white">
                          {overview.tierBreakdown[tier] || 0}
                        </p>
                        <p className="text-xs text-[#A8A49A]/40 capitalize mt-1">
                          {tier}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {overviewLoading && !overview && (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#C9A84C]" />
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─── Studios Tab ──────────────────────────────────────────────── */}
        <TabsContent value={1}>
          <div className="space-y-4 pt-4">
            {/* Search + Refresh */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#A8A49A]/40" />
                <Input
                  placeholder="Search studios..."
                  value={studioSearch}
                  onChange={(e) => setStudioSearch(e.target.value)}
                  className="pl-8 bg-[#111111] border-white/[0.08] text-white placeholder:text-[#A8A49A]/30"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStudios}
                disabled={studiosLoading}
                className="border-white/[0.08] text-[#A8A49A]/60 hover:text-white bg-transparent"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${studiosLoading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>

            {/* Studios table */}
            {studiosLoading && studios.length === 0 ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#C9A84C]" />
              </div>
            ) : (
              <div className="bg-[#111111] border border-white/[0.04] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.04]">
                        <th className="text-left text-xs font-medium text-[#A8A49A]/40 px-4 py-3">
                          Studio
                        </th>
                        <th className="text-left text-xs font-medium text-[#A8A49A]/40 px-4 py-3">
                          Tier
                        </th>
                        <th className="text-left text-xs font-medium text-[#A8A49A]/40 px-4 py-3">
                          Status
                        </th>
                        <th className="text-center text-xs font-medium text-[#A8A49A]/40 px-4 py-3">
                          Models
                        </th>
                        <th className="text-center text-xs font-medium text-[#A8A49A]/40 px-4 py-3">
                          Accounts
                        </th>
                        <th className="text-left text-xs font-medium text-[#A8A49A]/40 px-4 py-3">
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudios.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center text-[#A8A49A]/40 py-8"
                          >
                            No studios found.
                          </td>
                        </tr>
                      ) : (
                        filteredStudios.map((studio) => (
                          <tr
                            key={studio.id}
                            className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-white text-sm">
                                  {studio.name}
                                </p>
                                <p className="text-xs text-[#A8A49A]/40">
                                  {studio.subdomain}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant="outline"
                                className={`text-xs capitalize ${tierColor(studio.subscription_tier)}`}
                              >
                                {studio.subscription_tier}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge
                                variant="outline"
                                className={`text-xs capitalize ${statusColor(studio.subscription_status)}`}
                              >
                                {studio.subscription_status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-white text-sm">
                                {studio.account_counts.models}
                              </span>
                              <span className="text-[#A8A49A]/40 text-xs">
                                /{studio.model_limit}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-white text-sm">
                              {studio.account_counts.active}
                              <span className="text-[#A8A49A]/40 text-xs ml-1">
                                ({studio.account_counts.total})
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[#A8A49A]/60 text-xs">
                              {formatDate(studio.created_at)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ─── Error Logs Tab ───────────────────────────────────────────── */}
        <TabsContent value={2}>
          <div className="space-y-4 pt-4">
            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={errorTypeFilter}
                onChange={(e) => {
                  setErrorTypeFilter(e.target.value);
                  setErrorPage(1);
                }}
                className="h-8 rounded-lg border border-white/[0.08] bg-[#111111] px-2.5 text-sm text-white outline-none focus:border-[#C9A84C]/50"
              >
                <option value="">All error types</option>
                {(errorsData?.errorTypes || []).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchErrors}
                disabled={errorsLoading}
                className="border-white/[0.08] text-[#A8A49A]/60 hover:text-white bg-transparent"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${errorsLoading ? "animate-spin" : ""}`}
                />
              </Button>
              {errorsData && (
                <span className="text-xs text-[#A8A49A]/40 ml-auto">
                  {errorsData.pagination.total} total errors
                </span>
              )}
            </div>

            {/* Error table */}
            {errorsLoading && !errorsData ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-[#C9A84C]" />
              </div>
            ) : (
              <div className="bg-[#111111] border border-white/[0.04] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.04]">
                        <th className="text-left text-xs font-medium text-[#A8A49A]/40 px-4 py-3">
                          Type
                        </th>
                        <th className="text-left text-xs font-medium text-[#A8A49A]/40 px-4 py-3">
                          Message
                        </th>
                        <th className="text-left text-xs font-medium text-[#A8A49A]/40 px-4 py-3">
                          Studio ID
                        </th>
                        <th className="text-left text-xs font-medium text-[#A8A49A]/40 px-4 py-3">
                          URL
                        </th>
                        <th className="text-left text-xs font-medium text-[#A8A49A]/40 px-4 py-3">
                          Timestamp
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!errorsData?.errors ||
                        errorsData.errors.length === 0) ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center text-[#A8A49A]/40 py-8"
                          >
                            No errors found.
                          </td>
                        </tr>
                      ) : (
                        errorsData.errors.map((err) => (
                          <tr
                            key={err.id}
                            className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="px-4 py-3">
                              <Badge
                                variant="outline"
                                className="text-xs bg-red-500/10 text-red-400 border-red-500/20"
                              >
                                {err.error_type}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 max-w-[300px]">
                              <p className="text-white text-sm truncate">
                                {err.message}
                              </p>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-[#A8A49A]/60 text-xs font-mono">
                                {err.studio_id
                                  ? err.studio_id.slice(0, 8) + "..."
                                  : "-"}
                              </span>
                            </td>
                            <td className="px-4 py-3 max-w-[200px]">
                              <span className="text-[#A8A49A]/40 text-xs truncate block">
                                {err.url || "-"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[#A8A49A]/60 text-xs whitespace-nowrap">
                              {formatDateTime(err.created_at)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {errorsData && errorsData.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-white/[0.04] px-4 py-3">
                    <p className="text-xs text-[#A8A49A]/40">
                      Page {errorsData.pagination.page} of{" "}
                      {errorsData.pagination.totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={errorsData.pagination.page <= 1}
                        onClick={() => setErrorPage((p) => Math.max(1, p - 1))}
                        className="border-white/[0.08] text-[#A8A49A]/60 hover:text-white bg-transparent h-7 w-7 p-0"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          errorsData.pagination.page >=
                          errorsData.pagination.totalPages
                        }
                        onClick={() =>
                          setErrorPage((p) =>
                            Math.min(errorsData.pagination.totalPages, p + 1)
                          )
                        }
                        className="border-white/[0.08] text-[#A8A49A]/60 hover:text-white bg-transparent h-7 w-7 p-0"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Stats Card Sub-component ────────────────────────────────────────────────

function StatsCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-[#A8A49A]/40">{label}</span>
      </div>
      <p className="text-xl font-semibold text-white">{value}</p>
      {sub && <p className="text-xs text-[#A8A49A]/40 mt-1">{sub}</p>}
    </div>
  );
}
