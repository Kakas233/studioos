"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useShifts, useEarnings, useStudioAccounts, useGlobalSettings } from "@/hooks/use-studio-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Wallet, Calendar, CreditCard, Banknote, CalendarDays,
  TrendingUp, Clock, DollarSign, Users as UsersIcon,
} from "lucide-react";
import {
  format, parseISO, endOfMonth, isWithinInterval, getDate,
  startOfWeek, endOfWeek, addWeeks, startOfMonth,
} from "date-fns";
import { useCurrency } from "@/hooks/use-currency";

interface Period {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
  payDate: Date;
  type?: string;
}

function generatePeriods(frequency: string): Period[] {
  const periods: Period[] = [];
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear];

  for (const year of years) {
    if (frequency === "weekly") {
      const startDate = new Date(year, 0, 1);
      const firstMonday = startOfWeek(startDate, { weekStartsOn: 1 });
      for (let i = 0; i < 52; i++) {
        const ws = addWeeks(firstMonday, i);
        const we = endOfWeek(ws, { weekStartsOn: 1 });
        periods.push({
          id: `${year}-W${i + 1}`,
          label: `Week ${i + 1}: ${format(ws, "MMM d, yyyy")} - ${format(we, "MMM d")}`,
          startDate: ws,
          endDate: we,
          payDate: addWeeks(we, 0),
        });
      }
    } else if (frequency === "monthly") {
      for (let month = 0; month < 12; month++) {
        const start = startOfMonth(new Date(year, month));
        const end = endOfMonth(new Date(year, month));
        periods.push({
          id: `${year}-${month + 1}`,
          label: format(new Date(year, month), "MMMM yyyy"),
          startDate: start,
          endDate: end,
          payDate: new Date(year, month + 1, 5),
        });
      }
    } else {
      // biweekly (default)
      for (let month = 0; month < 12; month++) {
        periods.push({
          id: `${year}-${month + 1}-A`,
          label: `${format(new Date(year, month), "MMMM yyyy")} (1-15)`,
          startDate: new Date(year, month, 1),
          endDate: new Date(year, month, 15, 23, 59, 59),
          payDate: new Date(year, month, 17),
          type: "A",
        });
        const endOfMonthDate = endOfMonth(new Date(year, month, 16));
        const lastDay = getDate(endOfMonthDate);
        periods.push({
          id: `${year}-${month + 1}-B`,
          label: `${format(new Date(year, month), "MMMM yyyy")} (16-${lastDay})`,
          startDate: new Date(year, month, 16),
          endDate: endOfMonthDate,
          payDate: month === 11 ? new Date(year + 1, 0, 2) : new Date(year, month + 1, 2),
          type: "B",
        });
      }
    }
  }

  return periods.reverse();
}

export default function PayoutsPage() {
  const router = useRouter();
  const { account, loading: authLoading, isAdmin: authIsAdmin } = useAuth();
  const userRole = account?.role || "model";
  const isAccountant = userRole === "accountant";
  const isAdmin = authIsAdmin;

  const [selectedPeriod, setSelectedPeriod] = useState("");
  const { data: globalSettings } = useGlobalSettings();

  const frequency = globalSettings?.payout_frequency || "biweekly";
  const periods = generatePeriods(frequency);

  // Find the next upcoming payout period
  const getNextPayoutPeriodId = () => {
    const now = new Date();
    const chronological = [...periods].reverse();
    const current = chronological.find((p) => p.endDate >= now);
    return current?.id || periods[0]?.id;
  };

  useEffect(() => {
    if (periods.length > 0 && !selectedPeriod) {
      setSelectedPeriod(getNextPayoutPeriodId());
    }
  }, [frequency]);

  const { data: earnings = [] } = useEarnings();
  const { data: shifts = [] } = useShifts();
  const { data: allAccounts = [] } = useStudioAccounts();
  const { formatUsd, formatSecondary, secondaryCurrencyCode } = useCurrency();

  const getSecondaryGross = (e: any) => e.total_gross_secondary || 0;
  const getSecondaryModelPay = (e: any) => e.model_pay_secondary || 0;
  const getSecondaryOperatorPay = (e: any) => e.operator_pay_secondary || 0;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!account) {
    router.push("/sign-in");
    return null;
  }

  const currentPeriod = periods.find((p) => p.id === selectedPeriod);

  const filteredEarnings = earnings.filter((earning) => {
    if (userRole === "model" && earning.model_id !== account.id) return false;
    if (userRole === "operator" && earning.operator_id !== account.id) return false;
    if (!currentPeriod || !earning.shift_date) return false;
    const earningDate = parseISO(earning.shift_date);
    return isWithinInterval(earningDate, {
      start: currentPeriod.startDate,
      end: currentPeriod.endDate,
    });
  });

  const totalGrossUsd = filteredEarnings.reduce((sum, e) => sum + (e.total_gross_usd || 0), 0);
  const totalGrossSecondary = filteredEarnings.reduce((sum, e) => sum + getSecondaryGross(e), 0);
  const totalModelPayUsd = filteredEarnings.reduce((sum, e) => sum + (e.model_pay_usd || 0), 0);
  const totalModelPaySecondary = filteredEarnings.reduce((sum, e) => sum + getSecondaryModelPay(e), 0);
  const totalOperatorPayUsd = filteredEarnings.reduce((sum, e) => sum + (e.operator_pay_usd || 0), 0);
  const totalOperatorPaySecondary = filteredEarnings.reduce((sum, e) => sum + getSecondaryOperatorPay(e), 0);

  const payoutMethod = account?.payout_method || "Bank";

  const frequencyLabel = frequency === "weekly" ? "Weekly" : frequency === "monthly" ? "Monthly" : "Bi-Weekly";

  // Admin / accountant view
  if (isAdmin || isAccountant) {
    const userPayouts: Record<string, { id: string; name: string; role: string; method: string; amount: number }> = {};
    filteredEarnings.forEach((e) => {
      const modelPayVal = getSecondaryModelPay(e);
      if (e.model_id && modelPayVal) {
        if (!userPayouts[e.model_id]) {
          const acctInfo = allAccounts.find((u) => u.id === e.model_id);
          userPayouts[e.model_id] = {
            id: e.model_id, name: acctInfo?.first_name || "Unknown",
            role: "Model", method: acctInfo?.payout_method || "Bank", amount: 0,
          };
        }
        userPayouts[e.model_id].amount += modelPayVal;
      }
      const operatorPayVal = getSecondaryOperatorPay(e);
      if (e.operator_id && operatorPayVal) {
        if (!userPayouts[e.operator_id]) {
          const acctInfo = allAccounts.find((u) => u.id === e.operator_id);
          userPayouts[e.operator_id] = {
            id: e.operator_id, name: acctInfo?.first_name || "Unknown",
            role: "Operator", method: acctInfo?.payout_method || "Bank", amount: 0,
          };
        }
        userPayouts[e.operator_id].amount += operatorPayVal;
      }
    });

    const payoutList = Object.values(userPayouts);
    const modelPayouts = payoutList.filter((p) => p.role === "Model");
    const operatorPayouts = payoutList.filter((p) => p.role === "Operator");
    const totalPayroll = totalModelPaySecondary + totalOperatorPaySecondary;
    const netProfit = totalGrossSecondary - totalPayroll;

    return (
      <div className="space-y-4 sm:space-y-6">
        <Card className="bg-[#111111]/80 border-white/[0.04]">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <CalendarDays className="w-5 h-5 text-[#C9A84C] hidden sm:block" />
              <Badge variant="outline" className="bg-white/[0.03] text-slate-100 px-2.5 py-0.5 text-xs font-semibold rounded-md inline-flex items-center border border-white/[0.08] transition-colors focus:outline-none">{frequencyLabel} Payouts</Badge>
              <button
                onClick={() => setSelectedPeriod(getNextPayoutPeriodId())}
                className="px-3 py-1.5 text-xs font-medium text-[#C9A84C] bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-lg hover:bg-[#C9A84C]/20 transition-colors"
              >
                Show Next Payout
              </button>
              <Select value={selectedPeriod} onValueChange={(v) => v !== null && setSelectedPeriod(v)}>
                <SelectTrigger className="w-full sm:w-72 bg-white/[0.04] border-white/[0.06] text-white text-xs sm:text-sm"><SelectValue placeholder="Select pay period" /></SelectTrigger>
                <SelectContent>
                  {periods.map((period) => (
                    <SelectItem key={period.id} value={period.id}>{period.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#C9A84C]/20 to-[#C9A84C]/5 text-white border border-[#C9A84C]/20">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-[#C9A84C]/70" /><p className="text-sm text-[#A8A49A]/60">Total Revenue</p></div>
                <p className="text-2xl font-bold text-white">{formatSecondary(totalGrossSecondary)}</p>
                <p className="text-sm text-white/40">{formatUsd(totalGrossUsd)}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2"><UsersIcon className="w-4 h-4 text-[#C9A84C]/70" /><p className="text-sm text-[#A8A49A]/60">Total Payroll Cost</p></div>
                <p className="text-2xl font-bold text-white">{formatSecondary(totalPayroll)}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-[#C9A84C]" /><p className="text-sm text-[#A8A49A]/60">Net Studio Profit</p></div>
                <p className="text-3xl font-bold text-[#C9A84C]">{formatSecondary(netProfit)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <PayoutTable title="Models To Pay" icon={<Wallet className="w-5 h-5 text-[#C9A84C]" />} payouts={modelPayouts} currentPeriod={currentPeriod || null} formatAmount={formatSecondary} currencyCode={secondaryCurrencyCode} accentColor="text-[#C9A84C]" />
        <PayoutTable title="Operators To Pay" icon={<Wallet className="w-5 h-5 text-amber-500" />} payouts={operatorPayouts} currentPeriod={currentPeriod || null} formatAmount={formatSecondary} currencyCode={secondaryCurrencyCode} accentColor="text-amber-600" />

        <PayPeriodInfo frequency={frequency} />
      </div>
    );
  }

  // Model/Operator view
  return (
    <div className="space-y-6">
      <Card className="bg-[#111111]/80 border-white/[0.04]">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <CalendarDays className="w-5 h-5 text-[#C9A84C]" />
            <Badge variant="outline" className="bg-white/[0.03]">{frequencyLabel} Payouts</Badge>
            <Select value={selectedPeriod} onValueChange={(v) => v !== null && setSelectedPeriod(v)}>
              <SelectTrigger className="w-full sm:w-72 bg-white/[0.04] border-white/[0.06] text-white text-xs sm:text-sm"><SelectValue placeholder="Select pay period" /></SelectTrigger>
              <SelectContent>
                {periods.map((period) => (
                  <SelectItem key={period.id} value={period.id}>{period.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {currentPeriod && (
        <Card className="bg-gradient-to-br from-white/[0.05] to-white/[0.02] text-white border border-white/[0.06]">
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-4 sm:gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4 text-[#A8A49A]/60" /><p className="text-sm text-[#A8A49A]/60">Gross Revenue</p></div>
                <p className="text-xl font-bold">{formatUsd(totalGrossUsd)}</p>
                <p className="text-lg font-semibold text-white/60">{formatSecondary(totalGrossSecondary)}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2"><Wallet className="w-4 h-4 text-[#C9A84C]" /><p className="text-sm text-[#A8A49A]/60">Your Payout</p></div>
                <p className="text-xl font-bold text-[#C9A84C]">
                  {userRole === "model" ? formatUsd(totalModelPayUsd) : formatUsd(totalOperatorPayUsd)}
                </p>
                <p className="text-lg font-semibold text-[#C9A84C]/80">
                  {userRole === "model" ? formatSecondary(totalModelPaySecondary) : formatSecondary(totalOperatorPaySecondary)}
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2"><Calendar className="w-4 h-4 text-[#A8A49A]/60" /><p className="text-sm text-[#A8A49A]/60">Pay Date</p></div>
                <p className="text-2xl font-bold">{currentPeriod ? format(currentPeriod.payDate, "MMM d") : "—"}</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {payoutMethod === "Cash" ? <Banknote className="w-4 h-4 text-[#A8A49A]/60" /> : <CreditCard className="w-4 h-4 text-[#A8A49A]/60" />}
                  <p className="text-sm text-[#A8A49A]/60">Method</p>
                </div>
                <Badge className={`text-lg px-3 py-1 ${payoutMethod === "Cash" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-blue-500/10 text-blue-400 border-blue-500/20"}`}>
                  {payoutMethod}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-[#111111]/80 border-white/[0.04]">
        <CardHeader className="pb-3 border-b border-white/[0.04]">
          <CardTitle className="text-lg font-semibold text-white">Included Shifts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white/[0.03]">
                  <TableHead>Date</TableHead><TableHead>Time</TableHead>
                  <TableHead>Gross (USD)</TableHead><TableHead>Gross ({secondaryCurrencyCode})</TableHead>
                  <TableHead>Cut %</TableHead><TableHead>Payout (USD)</TableHead><TableHead>Payout ({secondaryCurrencyCode})</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEarnings.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-white/50">No earnings in this period</TableCell></TableRow>
                ) : (
                  filteredEarnings.map((earning) => {
                    const shift = shifts.find((s) => s.id === earning.shift_id);
                    return (
                      <TableRow key={earning.id} className="hover:bg-white/[0.03]/50">
                        <TableCell className="font-medium">{earning.shift_date ? format(parseISO(earning.shift_date), "MMM d") : "-"}</TableCell>
                        <TableCell className="text-white/70">
                          {shift ? `${format(parseISO(shift.start_time), "HH:mm")} - ${format(parseISO(shift.end_time), "HH:mm")}` : "-"}
                        </TableCell>
                        <TableCell className="font-medium">{formatUsd(earning.total_gross_usd)}</TableCell>
                        <TableCell className="font-medium">{formatSecondary(getSecondaryGross(earning))}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-white/[0.03]">
                            {userRole === "model" ? (earning as any).model_cut_percentage || 40 : (earning as any).operator_cut_percentage || 33}%
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-[#C9A84C]">
                          {userRole === "model" ? formatUsd(earning.model_pay_usd) : formatUsd(earning.operator_pay_usd)}
                        </TableCell>
                        <TableCell className="font-bold text-[#C9A84C]">
                          {userRole === "model" ? formatSecondary(getSecondaryModelPay(earning)) : formatSecondary(getSecondaryOperatorPay(earning))}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <PayPeriodInfo frequency={frequency} />
    </div>
  );
}

function PayoutTable({
  title,
  icon,
  payouts,
  currentPeriod,
  formatAmount,
  currencyCode,
  accentColor,
}: {
  title: string;
  icon: React.ReactNode;
  payouts: { id: string; name: string; role: string; method: string; amount: number }[];
  currentPeriod: Period | null;
  formatAmount: (v: number) => string;
  currencyCode: string;
  accentColor: string;
}) {
  return (
    <Card className="bg-[#111111]/80 border-white/[0.04]">
      <CardHeader className="pb-3 border-b border-white/[0.04]">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">{icon}{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow className="bg-white/[0.03]"><TableHead>Name</TableHead><TableHead>Method</TableHead><TableHead>Amount ({currencyCode})</TableHead><TableHead>Due Date</TableHead></TableRow></TableHeader>
            <TableBody>
              {payouts.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-white/50">No payouts in this period</TableCell></TableRow>
              ) : (
                payouts.map((payout) => (
                  <TableRow key={payout.id} className="hover:bg-white/[0.03]/50">
                    <TableCell className="font-medium text-white">{payout.name}</TableCell>
                    <TableCell>
                      {payout.method === "Cash" ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"><Banknote className="w-3 h-3 mr-1" />Cash</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20"><CreditCard className="w-3 h-3 mr-1" />Bank</Badge>
                      )}
                    </TableCell>
                    <TableCell className={`font-bold ${accentColor} text-lg`}>{formatAmount(payout.amount)}</TableCell>
                    <TableCell className="text-white/70">{currentPeriod && format(currentPeriod.payDate, "MMM d, yyyy")}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function PayPeriodInfo({ frequency }: { frequency: string }) {
  return (
    <Card className="bg-[#C9A84C]/[0.06] border-[#C9A84C]/10">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Clock className="w-5 h-5 text-[#C9A84C]/70 mt-0.5" />
          <div>
            <p className="font-medium text-[#C9A84C]/80">Pay Period Information</p>
            <ul className="text-sm text-[#A8A49A]/50 mt-1 space-y-1">
              {frequency === "weekly" && (
                <li>&#8226; <strong>Weekly:</strong> Each Monday-Sunday is a pay period. Paid at the end of the week.</li>
              )}
              {frequency === "biweekly" && (
                <>
                  <li>&#8226; <strong>Period A (1st-15th):</strong> Paid on the 17th of the same month</li>
                  <li>&#8226; <strong>Period B (16th-End):</strong> Paid on the 2nd of the next month</li>
                </>
              )}
              {frequency === "monthly" && (
                <li>&#8226; <strong>Monthly:</strong> Full month period. Paid on the 5th of the following month.</li>
              )}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
