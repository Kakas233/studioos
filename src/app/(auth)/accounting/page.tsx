"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useEarnings, useStudioAccounts } from "@/hooks/use-studio-data";
import { useCurrency } from "@/hooks/use-currency";
import { Loader2, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseISO, format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import type { Database } from "@/lib/supabase/types";

type Earning = Database["public"]["Tables"]["earnings"]["Row"];

export default function AccountingPage() {
  const { account, isAdmin, role } = useAuth();
  const userRole = role || "owner";

  const { data: earnings = [], isLoading: earningsLoading } = useEarnings();
  const { data: accounts = [], isLoading: accountsLoading } = useStudioAccounts();
  const { formatUsdShort } = useCurrency();

  const now = new Date();
  const [dateRange, setDateRange] = useState({
    start: startOfMonth(now),
    end: endOfMonth(now),
  });

  const filteredEarnings = useMemo(() => {
    let result = earnings as Earning[];

    // Role-based filtering
    if (!isAdmin && userRole !== "accountant") {
      if (userRole === "model") {
        result = result.filter((e) => e.model_id === account?.id);
      } else if (userRole === "operator") {
        result = result.filter((e) => e.operator_id === account?.id);
      }
    }

    // Date filtering
    result = result.filter((e) => {
      if (!e.shift_date) return false;
      try {
        return isWithinInterval(parseISO(e.shift_date), {
          start: dateRange.start,
          end: dateRange.end,
        });
      } catch {
        return false;
      }
    });

    return result;
  }, [earnings, isAdmin, userRole, account?.id, dateRange]);

  const totalGross = filteredEarnings.reduce(
    (sum, e) => sum + (Number(e.total_gross_usd) || 0),
    0
  );
  const totalModelPay = filteredEarnings.reduce(
    (sum, e) => sum + (Number(e.model_pay_usd) || 0),
    0
  );
  const totalOperatorPay = filteredEarnings.reduce(
    (sum, e) => sum + (Number(e.operator_pay_usd) || 0),
    0
  );
  const studioNet = totalGross - totalModelPay - totalOperatorPay;

  const getAccountName = (id: string | null) => {
    if (!id) return "N/A";
    const acc = accounts.find((a) => a.id === id);
    return acc ? `${acc.first_name || ""} ${acc.last_name || ""}`.trim() : "Unknown";
  };

  const isLoading = earningsLoading || accountsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Date Range & Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#A8A49A]/40" />
          <span className="text-sm text-white">
            {format(dateRange.start, "MMM d")} - {format(dateRange.end, "MMM d, yyyy")}
          </span>
        </div>
        <Button
          variant="outline"
          className="border-white/[0.08] text-[#A8A49A]/60 hover:text-white bg-transparent"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-[#A8A49A]/40 mb-1">Total Revenue</p>
          <p className="text-lg sm:text-xl font-semibold text-white">
            {formatUsdShort(totalGross)}
          </p>
        </div>
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-[#A8A49A]/40 mb-1">Model Payouts</p>
          <p className="text-lg sm:text-xl font-semibold text-pink-400">
            {formatUsdShort(totalModelPay)}
          </p>
        </div>
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-[#A8A49A]/40 mb-1">Operator Payouts</p>
          <p className="text-lg sm:text-xl font-semibold text-blue-400">
            {formatUsdShort(totalOperatorPay)}
          </p>
        </div>
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-[#A8A49A]/40 mb-1">Studio Net</p>
          <p className="text-lg sm:text-xl font-semibold text-[#C9A84C]">
            {formatUsdShort(studioNet)}
          </p>
        </div>
      </div>

      {/* Earnings Table */}
      <div className="bg-[#111111] border border-white/[0.04] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.04]">
          <p className="text-sm font-medium text-white">
            Earnings ({filteredEarnings.length})
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="text-left px-4 py-2.5 text-[10px] font-medium text-[#A8A49A]/40 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left px-4 py-2.5 text-[10px] font-medium text-[#A8A49A]/40 uppercase tracking-wider">
                  Model
                </th>
                <th className="text-left px-4 py-2.5 text-[10px] font-medium text-[#A8A49A]/40 uppercase tracking-wider">
                  Operator
                </th>
                <th className="text-right px-4 py-2.5 text-[10px] font-medium text-[#A8A49A]/40 uppercase tracking-wider">
                  Gross
                </th>
                <th className="text-right px-4 py-2.5 text-[10px] font-medium text-[#A8A49A]/40 uppercase tracking-wider">
                  Model Pay
                </th>
                <th className="text-right px-4 py-2.5 text-[10px] font-medium text-[#A8A49A]/40 uppercase tracking-wider">
                  Op. Pay
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredEarnings.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-[#A8A49A]/30"
                  >
                    No earnings found for this period.
                  </td>
                </tr>
              )}
              {filteredEarnings.slice(0, 50).map((earning) => (
                <tr
                  key={earning.id}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-2.5 text-[#A8A49A]/60 text-xs">
                    {earning.shift_date
                      ? format(parseISO(earning.shift_date), "MMM d")
                      : "-"}
                  </td>
                  <td className="px-4 py-2.5 text-white text-xs">
                    {getAccountName(earning.model_id)}
                  </td>
                  <td className="px-4 py-2.5 text-[#A8A49A]/60 text-xs">
                    {getAccountName(earning.operator_id)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-white text-xs">
                    {formatUsdShort(Number(earning.total_gross_usd) || 0)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-pink-400 text-xs">
                    {formatUsdShort(Number(earning.model_pay_usd) || 0)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-blue-400 text-xs">
                    {formatUsdShort(Number(earning.operator_pay_usd) || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredEarnings.length > 50 && (
          <div className="px-4 py-2 border-t border-white/[0.04] text-center">
            <p className="text-xs text-[#A8A49A]/30">
              Showing 50 of {filteredEarnings.length} records
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
