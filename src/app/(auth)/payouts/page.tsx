"use client";

import { useMemo } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { usePayouts, useStudioAccounts } from "@/hooks/use-studio-data";
import { useCurrency } from "@/hooks/use-currency";
import { Loader2, Wallet, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { parseISO, format } from "date-fns";
import type { Database } from "@/lib/supabase/types";

type Payout = Database["public"]["Tables"]["payouts"]["Row"];

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle2; color: string; bg: string }> = {
  paid: { icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  pending: { icon: Clock, color: "text-yellow-400", bg: "bg-yellow-500/10" },
  processing: { icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10" },
  failed: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
};

export default function PayoutsPage() {
  const { account, isAdmin, role } = useAuth();
  const userRole = role || "owner";

  const { data: payouts = [], isLoading: payoutsLoading } = usePayouts();
  const { data: accounts = [], isLoading: accountsLoading } = useStudioAccounts();
  const { formatUsdShort } = useCurrency();

  const filteredPayouts = useMemo(() => {
    if (isAdmin || userRole === "accountant") return payouts as Payout[];
    return (payouts as Payout[]).filter((p) => p.model_id === account?.id);
  }, [payouts, isAdmin, userRole, account?.id]);

  const totalPaid = filteredPayouts
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + (Number(p.amount_usd) || 0), 0);

  const totalPending = filteredPayouts
    .filter((p) => p.status === "pending" || p.status === "processing")
    .reduce((sum, p) => sum + (Number(p.amount_usd) || 0), 0);

  const getAccountName = (id: string | null) => {
    if (!id) return "N/A";
    const acc = accounts.find((a) => a.id === id);
    return acc ? `${acc.first_name || ""} ${acc.last_name || ""}`.trim() : "Unknown";
  };

  const isLoading = payoutsLoading || accountsLoading;

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
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-[#A8A49A]/40 mb-1">Total Payouts</p>
          <p className="text-lg sm:text-xl font-semibold text-white">
            {filteredPayouts.length}
          </p>
        </div>
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-[#A8A49A]/40 mb-1">Total Paid</p>
          <p className="text-lg sm:text-xl font-semibold text-emerald-400">
            {formatUsdShort(totalPaid)}
          </p>
        </div>
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-[#A8A49A]/40 mb-1">Pending</p>
          <p className="text-lg sm:text-xl font-semibold text-yellow-400">
            {formatUsdShort(totalPending)}
          </p>
        </div>
      </div>

      {/* Payouts List */}
      <div className="bg-[#111111] border border-white/[0.04] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.04]">
          <p className="text-sm font-medium text-white">Payout History</p>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {filteredPayouts.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Wallet className="w-10 h-10 text-[#A8A49A]/20 mx-auto mb-3" />
              <p className="text-sm text-[#A8A49A]/40">No payouts found</p>
              <p className="text-xs text-[#A8A49A]/25 mt-1">
                Payouts will appear here once earnings are processed.
              </p>
            </div>
          ) : (
            filteredPayouts.map((payout) => {
              const statusKey = (payout.status || "pending") as string;
              const config = STATUS_CONFIG[statusKey] || STATUS_CONFIG.pending;
              const StatusIcon = config.icon;

              return (
                <div
                  key={payout.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center shrink-0`}>
                    <StatusIcon className={`w-4 h-4 ${config.color}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white">
                      {(isAdmin || userRole === "accountant")
                        ? getAccountName(payout.model_id)
                        : "My Payout"}
                    </p>
                    <p className="text-xs text-[#A8A49A]/40">
                      {payout.period_start && payout.period_end
                        ? `${format(parseISO(payout.period_start), "MMM d")} - ${format(parseISO(payout.period_end), "MMM d, yyyy")}`
                        : "Period N/A"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-white">
                      {formatUsdShort(Number(payout.amount_usd) || 0)}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-[9px] capitalize ${config.color} border-transparent ${config.bg}`}
                    >
                      {payout.status}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
