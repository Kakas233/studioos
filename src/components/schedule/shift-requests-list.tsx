"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Clock, CalendarClock } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useStudioAccounts } from "@/hooks/use-studio-data";
import type { Database } from "@/lib/supabase/types";

type ShiftRequest = Database["public"]["Tables"]["shift_requests"]["Row"];

const statusStyles: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  approved: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/15 text-red-400 border-red-500/20",
};

interface ShiftRequestsListProps {
  requests: ShiftRequest[];
  canReview: boolean;
  onApprove: (request: ShiftRequest) => void;
  onReject: (request: ShiftRequest) => void;
}

export default function ShiftRequestsList({ requests, canReview, onApprove, onReject }: ShiftRequestsListProps) {
  const { data: accounts = [] } = useStudioAccounts();

  if (!requests || requests.length === 0) return null;

  const getModelName = (modelId: string) => {
    const account = accounts.find((a) => a.id === modelId);
    return account?.first_name || "Unknown";
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const otherRequests = requests.filter((r) => r.status !== "pending");

  return (
    <Card className="bg-[#111111]/80 border-white/[0.04]">
      <CardHeader className="pb-3 border-b border-white/[0.04]">
        <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-[#C9A84C]" />
          Shift Requests
          {pendingRequests.length > 0 && (
            <Badge className="bg-amber-500/20 text-amber-400 border-0 ml-2">{pendingRequests.length} pending</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        {pendingRequests.map((req) => (
          <div key={req.id} className="flex items-center justify-between p-3 bg-amber-500/[0.06] rounded-lg border border-amber-500/10">
            <div>
              <p className="font-medium text-white">{getModelName(req.model_id)}</p>
              <p className="text-sm text-[#A8A49A]/40">
                {format(parseISO(req.requested_date), "EEE, MMM d")} {"\u2022"} {req.start_time} {"\u2013"} {req.end_time}
              </p>
              {req.preferred_room_id && (
                <p className="text-xs text-[#A8A49A]/30">Room requested</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge className={statusStyles[req.status]}>
                <Clock className="w-3 h-3 mr-1" />Pending
              </Badge>
              {canReview && (
                <>
                  <Button size="sm" onClick={() => onApprove(req)} className="bg-emerald-600 hover:bg-emerald-700 text-white h-8">
                    <Check className="w-3 h-3 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onReject(req)} className="text-red-400 border-red-500/20 hover:bg-red-500/10 h-8">
                    <X className="w-3 h-3 mr-1" /> Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}

        {otherRequests.slice(0, 5).map((req) => (
          <div key={req.id} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-lg">
            <div>
              <p className="font-medium text-white">{getModelName(req.model_id)}</p>
              <p className="text-sm text-[#A8A49A]/40">
                {format(parseISO(req.requested_date), "EEE, MMM d")} {"\u2022"} {req.start_time} {"\u2013"} {req.end_time}
              </p>
            </div>
            <Badge className={statusStyles[req.status]}>{req.status}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
