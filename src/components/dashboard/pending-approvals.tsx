"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Check, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useCurrency } from "@/hooks/use-currency";
import type { Database } from "@/lib/supabase/types";

type ChangeRequest = Database["public"]["Tables"]["shift_change_requests"]["Row"];

interface PendingApprovalsProps {
  changeRequests: ChangeRequest[];
  onApprove: (request: ChangeRequest) => void;
  onReject: (request: ChangeRequest) => void;
}

export default function PendingApprovals({ changeRequests = [], onApprove, onReject }: PendingApprovalsProps) {
  const pendingRequests = changeRequests.filter((r) => r.status === "pending");
  const { formatUsd, formatSecondary } = useCurrency();
  if (pendingRequests.length === 0) return null;

  return (
    <Card className="bg-amber-500/[0.06] border-amber-500/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium text-amber-400 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Pending Approvals
          <Badge className="bg-amber-500/20 text-amber-400 border-0 ml-2">{pendingRequests.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingRequests.map((request) => {
          const oldData = request.old_data as Record<string, number> | null;
          const newData = request.new_data as Record<string, number> | null;
          return (
            <div key={request.id} className="bg-[#111111]/60 rounded-lg border border-white/[0.04] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{(request as Record<string, unknown>).requested_by_name as string || "Unknown"}</p>
                  <p className="text-sm text-[#A8A49A]/40">
                    {request.created_at && format(parseISO(request.created_at), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#A8A49A]/40 text-xs mb-1">Old Value</p>
                  <p className="font-medium text-white">{formatUsd(oldData?.total_gross_usd || 0)}</p>
                  <p className="text-[#A8A49A]/30 text-xs">{formatSecondary(oldData?.total_gross_secondary || oldData?.total_gross_huf || 0)}</p>
                </div>
                <div>
                  <p className="text-[#A8A49A]/40 text-xs mb-1">New Value</p>
                  <p className="font-medium text-emerald-400">{formatUsd(newData?.total_gross_usd || 0)}</p>
                  <p className="text-emerald-400/60 text-xs">{formatSecondary(newData?.total_gross_secondary || newData?.total_gross_huf || 0)}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" onClick={() => onApprove(request)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Check className="w-4 h-4 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => onReject(request)} className="flex-1 text-red-400 hover:text-red-300 border-red-500/20 hover:bg-red-500/10">
                  <X className="w-4 h-4 mr-1" /> Reject
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
