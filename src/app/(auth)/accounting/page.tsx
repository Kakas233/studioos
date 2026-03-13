"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { useShifts, useEarnings, useGlobalSettings, useStudioAccounts, useRooms } from "@/hooks/use-studio-data";
import EarningsForm from "@/components/accounting/earnings-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DollarSign, TrendingUp, Edit2, FileText, Eye } from "lucide-react";
import { format, parseISO, isBefore } from "date-fns";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/use-currency";
import { createClient } from "@/lib/supabase/client";

export default function AccountingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { account, loading: authLoading, isAdmin } = useAuth();
  const userRole = account?.role || "model";
  const isAccountant = userRole === "accountant";

  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [earningsModalOpen, setEarningsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: shifts = [] } = useShifts();
  const { data: earnings = [] } = useEarnings();
  const { data: settings } = useGlobalSettings();
  const { data: allAccounts = [] } = useStudioAccounts();
  const { data: rooms = [] } = useRooms();

  const globalSettings = settings || { exchange_rate: 1 };
  const { formatUsd, formatSecondary, secondaryCurrencyCode } = useCurrency();

  const supabase = createClient();

  // Helper to get account name by ID
  const getAccountName = (id: string | null) => {
    if (!id) return "Unknown";
    const acc = allAccounts.find((a) => a.id === id);
    return acc?.first_name || "Unknown";
  };

  // Helper to get room name by ID
  const getRoomName = (id: string | null) => {
    if (!id) return "N/A";
    const room = rooms.find((r) => r.id === id);
    return room?.name || "N/A";
  };

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

  const now = new Date();
  const pastShifts = shifts.filter((shift) => {
    const isPast = isBefore(parseISO(shift.end_time), now);
    if (!isPast) return false;
    if (isAdmin) return true;
    if (userRole === "operator") return shift.operator_id === account.id;
    if (userRole === "model") return shift.model_id === account.id;
    return false;
  });

  const filteredShifts = pastShifts.filter((shift) => {
    if (statusFilter === "all") return true;
    return shift.status === statusFilter;
  });

  const getEarningForShift = (shiftId: string) => earnings.find((e) => e.shift_id === shiftId);

  const handleReportEarnings = (shift: any) => {
    setSelectedShift(shift);
    setEarningsModalOpen(true);
  };

  const handleSaveEarning = async (earningData: Record<string, unknown>, requiresApproval: boolean) => {
    const existingEarning = getEarningForShift(selectedShift.id);

    if (requiresApproval) {
      await supabase.from("shift_change_requests").insert({
        studio_id: account?.studio_id,
        shift_id: selectedShift.id,
        requested_by_id: account.id,
        old_data: existingEarning || {},
        new_data: earningData,
        status: "pending",
      });
      await supabase.from("shifts").update({ status: "pending_approval" }).eq("id", selectedShift.id);
      queryClient.invalidateQueries({ queryKey: ["shiftChangeRequests"] });
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      setEarningsModalOpen(false);
      setSelectedShift(null);
      toast.success("Edit request sent to Admin for approval");
      return;
    }

    let earningsError;
    if (existingEarning) {
      const { error } = await supabase.from("earnings").update(earningData).eq("id", existingEarning.id);
      earningsError = error;
    } else {
      const { error } = await supabase.from("earnings").insert(earningData);
      earningsError = error;
    }

    if (earningsError) {
      toast.error(`Failed to save earnings: ${earningsError.message}`);
      return;
    }

    await supabase.from("shifts").update({ status: "completed" }).eq("id", selectedShift.id);
    queryClient.invalidateQueries({ queryKey: ["earnings"] });
    queryClient.invalidateQueries({ queryKey: ["shifts"] });
    setEarningsModalOpen(false);
    setSelectedShift(null);
    toast.success("Earnings saved and shift marked as completed");
  };

  const getSecondaryGross = (e: any) => e.total_gross_secondary || 0;
  const getSecondaryModelPay = (e: any) => e.model_pay_secondary || 0;
  const getSecondaryOperatorPay = (e: any) => e.operator_pay_secondary || 0;

  const allEarnings = earnings.filter((e) => {
    if (isAdmin) return true;
    if (isAccountant) return true;
    if (userRole === "model") return e.model_id === account.id;
    if (userRole === "operator") return e.operator_id === account.id;
    return false; // Unknown roles see nothing by default
  });

  const totalGrossUsd = allEarnings.reduce((sum, e) => sum + (e.total_gross_usd || 0), 0);
  const totalGrossSecondary = allEarnings.reduce((sum, e) => sum + getSecondaryGross(e), 0);
  const totalModelPay = userRole === "model" ? allEarnings.reduce((sum, e) => sum + getSecondaryModelPay(e), 0) : 0;
  const totalOperatorPay = userRole === "operator" ? allEarnings.reduce((sum, e) => sum + getSecondaryOperatorPay(e), 0) : 0;

  const statusColors: Record<string, string> = {
    scheduled: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    no_show: "bg-red-500/20 text-red-400 border-red-500/30",
    cancelled: "bg-white/[0.06] text-white/50 border-white/[0.08]",
    pending_approval: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  };

  const canEdit = isAdmin || userRole === "operator";
  const isReadOnly = userRole === "model" || isAccountant;
  const effectiveUserRole = isAdmin ? "admin" : isAccountant ? "admin" : userRole;

  return (
    <div className="space-y-4 sm:space-y-6">
      {isAccountant && (
        <Card className="bg-blue-500/[0.06] border-blue-500/10">
          <CardContent className="p-4">
            <p className="text-blue-300 text-sm">You have read-only access to all financial data for accounting purposes.</p>
          </CardContent>
        </Card>
      )}
      {userRole === "model" && (
        <Card className="bg-blue-500/[0.06] border-blue-500/10">
          <CardContent className="p-4">
            <p className="text-blue-300 text-sm">Earnings are reported by your operator. You can view them here.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-[#111111]/80 border-white/[0.04]">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 rounded-xl"><TrendingUp className="w-5 h-5 text-emerald-400" /></div>
              <div>
                <p className="text-sm text-white/60">Total Gross</p>
                <p className="text-lg font-bold text-white">{formatUsd(totalGrossUsd)}</p>
                <p className="text-sm text-white/50">{formatSecondary(totalGrossSecondary)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {userRole === "model" && (
          <Card className="bg-[#111111]/80 border-white/[0.04]">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-[#C9A84C]/10 rounded-xl"><DollarSign className="w-5 h-5 text-[#C9A84C]" /></div>
                <div>
                  <p className="text-sm text-white/60">My Earnings</p>
                  <p className="text-lg font-bold text-white">{formatSecondary(totalModelPay)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {userRole === "operator" && (
          <Card className="bg-[#111111]/80 border-white/[0.04]">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 rounded-xl"><DollarSign className="w-5 h-5 text-amber-400" /></div>
                <div>
                  <p className="text-sm text-white/60">My Earnings</p>
                  <p className="text-lg font-bold text-white">{formatSecondary(totalOperatorPay)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="bg-[#111111]/80 border-white/[0.04]">
        <CardHeader className="pb-3 border-b border-[#1F2937]/10">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-base sm:text-lg font-semibold text-white">All Shifts</CardTitle>
            <Select value={statusFilter} onValueChange={(v) => v !== null && setStatusFilter(v)}>
              <SelectTrigger className="w-32 sm:w-40 bg-white/[0.04] border-white/[0.06] text-white text-xs sm:text-sm"><SelectValue placeholder="Filter by status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white/[0.03]">
                  <TableHead className="text-white/70">Date</TableHead><TableHead className="text-white/70">Model</TableHead><TableHead className="text-white/70">Time</TableHead>
                  <TableHead className="text-white/70">Status</TableHead><TableHead className="text-white/70">Gross (USD)</TableHead><TableHead className="text-white/70">Gross ({secondaryCurrencyCode})</TableHead>
                  {isAdmin && <TableHead className="text-white/70">Model Pay</TableHead>}
                  {isAdmin && <TableHead className="text-white/70">Operator Pay</TableHead>}
                  {userRole === "model" && <TableHead className="text-white/70">My Pay</TableHead>}
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShifts.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-white/50">No past shifts found</TableCell></TableRow>
                ) : (
                  filteredShifts.map((shift) => {
                    const earning = getEarningForShift(shift.id);
                    const hasEarning = !!earning;
                    return (
                      <TableRow key={shift.id} className="hover:bg-white/[0.03]/50">
                        <TableCell className="font-medium text-white">{format(parseISO(shift.start_time), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-white">{getAccountName(shift.model_id)}</TableCell>
                        <TableCell className="text-white/70">
                          {format(parseISO(shift.start_time), "HH:mm")} - {format(parseISO(shift.end_time), "HH:mm")}
                        </TableCell>
                        <TableCell><Badge className={statusColors[shift.status]}>{shift.status}</Badge></TableCell>
                        <TableCell className="font-medium text-white">{hasEarning ? formatUsd(earning.total_gross_usd) : "-"}</TableCell>
                        <TableCell className="font-medium text-white">{hasEarning ? formatSecondary(getSecondaryGross(earning)) : "-"}</TableCell>
                        {isAdmin && (
                          <>
                            <TableCell className="font-medium text-[#C9A84C]">{hasEarning ? formatSecondary(getSecondaryModelPay(earning)) : "-"}</TableCell>
                            <TableCell className="font-medium text-amber-400">{hasEarning ? formatSecondary(getSecondaryOperatorPay(earning)) : "-"}</TableCell>
                          </>
                        )}
                        {userRole === "model" && (
                          <TableCell className="font-medium text-[#C9A84C]">{hasEarning ? formatSecondary(getSecondaryModelPay(earning)) : "-"}</TableCell>
                        )}
                        <TableCell>
                          {canEdit ? (
                            <Button variant="ghost" size="sm" onClick={() => handleReportEarnings(shift)}
                              className={hasEarning ? "text-blue-400 hover:text-blue-300" : "text-[#C9A84C] hover:text-[#E8D48B]"}>
                              {hasEarning ? (<><Edit2 className="w-4 h-4 mr-1" />Edit</>) : (<><FileText className="w-4 h-4 mr-1" />Report</>)}
                            </Button>
                          ) : hasEarning ? (
                            <Button variant="ghost" size="sm" onClick={() => handleReportEarnings(shift)} className="text-blue-400 hover:text-blue-300">
                              <Eye className="w-4 h-4 mr-1" />View
                            </Button>
                          ) : null}
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

      {(canEdit || (isReadOnly && selectedShift)) && selectedShift && (
        <EarningsForm
          open={earningsModalOpen}
          onClose={() => { setEarningsModalOpen(false); setSelectedShift(null); }}
          onSave={handleSaveEarning}
          shift={selectedShift}
          existingEarning={selectedShift ? getEarningForShift(selectedShift.id) || null : null}
          globalSettings={globalSettings as any}
          allUsers={allAccounts as any}
          operatorInfo={{ id: account.id, name: account.first_name }}
          isReadOnly={isReadOnly}
          userRole={effectiveUserRole}
          modelName={getAccountName(selectedShift.model_id)}
          roomName={getRoomName(selectedShift.room_id)}
        />
      )}
    </div>
  );
}
