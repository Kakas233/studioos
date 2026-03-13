"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useShifts, useRooms, useAssignments, useStudioAccounts, useShiftRequests } from "@/hooks/use-studio-data";
import { createClient } from "@/lib/supabase/client";
import ShiftCalendar from "@/components/schedule/shift-calendar";
import ShiftModal from "@/components/schedule/shift-modal";
import ShiftRequestModal from "@/components/schedule/shift-request-modal";
import ShiftRequestsList from "@/components/schedule/shift-requests-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isSunday, isAfter, setHours, setMinutes, parseISO } from "date-fns";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { useConfirmDialog } from "@/components/shared/confirm-dialog";
import type { Database } from "@/lib/supabase/types";

type Shift = Database["public"]["Tables"]["shifts"]["Row"];
type ShiftRequest = Database["public"]["Tables"]["shift_requests"]["Row"];

const supabase = createClient();

async function apiShiftCreate(data: Record<string, unknown>) {
  const res = await fetch("/api/shifts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to create shift");
  return json;
}

async function apiShiftUpdate(id: string, data: Record<string, unknown>) {
  const res = await fetch("/api/shifts", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...data }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to update shift");
  return json;
}

async function apiShiftDelete(id: string) {
  const res = await fetch(`/api/shifts?id=${id}`, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to delete shift");
  return json;
}

export default function SchedulePage() {
  const queryClient = useQueryClient();
  const { account, loading: authLoading, isAdmin } = useAuth();
  const userRole = account?.role || "model";

  const { confirm, ConfirmDialogEl } = useConfirmDialog();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  const { data: shifts = [], error: shiftsError, isLoading: shiftsLoading } = useShifts();
  const { data: rooms = [] } = useRooms();
  const { data: assignments = [] } = useAssignments();
  const { data: allAccounts = [] } = useStudioAccounts();
  const { data: shiftRequests = [] } = useShiftRequests();

  const models = allAccounts.filter((u) => u.role === "model" && u.is_active !== false);
  const operators = allAccounts.filter((u) => (u.role === "operator" || u.role === "admin" || u.role === "owner") && u.is_active !== false);

  // Check if current model works alone
  const isModelWorksAlone = userRole === "model" && account?.works_alone === true;

  const createShiftMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      return apiShiftCreate(data);
    },
    onSuccess: (newShift) => {
      // Optimistically add the new shift to ALL shift query caches
      queryClient.setQueriesData<Shift[]>(
        { queryKey: ["shifts"] },
        (old) => old ? [...old, newShift] : [newShift]
      );
      // Also refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      setModalOpen(false);
      setSelectedShift(null);
      toast.success("Shift created successfully");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create shift"),
  });

  const updateShiftMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      return apiShiftUpdate(id, data);
    },
    onSuccess: (updatedShift) => {
      // Optimistically update the shift in cache
      queryClient.setQueriesData<Shift[]>(
        { queryKey: ["shifts"] },
        (old) => old ? old.map((s) => s.id === updatedShift.id ? updatedShift : s) : []
      );
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      setModalOpen(false);
      setSelectedShift(null);
      toast.success("Shift updated successfully");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update shift"),
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiShiftDelete(id);
      return id;
    },
    onSuccess: (deletedId) => {
      // Optimistically remove the shift from cache
      queryClient.setQueriesData<Shift[]>(
        { queryKey: ["shifts"] },
        (old) => old ? old.filter((s) => s.id !== deletedId) : []
      );
      queryClient.invalidateQueries({ queryKey: ["shifts"] });
      setModalOpen(false);
      setSelectedShift(null);
      toast.success("Shift deleted");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to delete shift"),
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!account) return null;

  const filteredShifts = shifts.filter((shift) => {
    if (isAdmin) return true;
    if (userRole === "operator") return shift.operator_id === account.id;
    if (userRole === "model") return shift.model_id === account.id;
    return false;
  });

  const now = new Date();
  const sundayLockTime = isSunday(now) ? setMinutes(setHours(new Date(now), 20), 0) : null;
  const isLocked = sundayLockTime ? isAfter(now, sundayLockTime) : false;
  const canEdit = isAdmin || userRole === "operator" || isModelWorksAlone;

  const handleAddShift = () => { setSelectedShift(null); setModalOpen(true); };
  const handleEditShift = (shift: Shift) => { setSelectedShift(shift); setModalOpen(true); };
  const handleSaveShift = (shiftData: Record<string, unknown>) => {
    if (selectedShift) {
      updateShiftMutation.mutate({ id: selectedShift.id, data: shiftData });
    } else {
      createShiftMutation.mutate(shiftData);
    }
  };
  const handleDeleteShift = async (id: string) => {
    const ok = await confirm({ title: "Delete Shift", description: "Are you sure you want to delete this shift?", confirmLabel: "Delete", variant: "destructive" });
    if (ok) deleteShiftMutation.mutate(id);
  };

  // Shift request mutations (direct Supabase — shift_requests RLS allows model insert)
  const createShiftRequestMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const { error } = await supabase.from("shift_requests").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shiftRequests"] });
      toast.success("Shift request submitted");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to submit shift request"),
  });

  const updateShiftRequestMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const { error } = await supabase.from("shift_requests").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shiftRequests"] });
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update shift request"),
  });

  const handleSubmitRequests = (requestsList: Array<{ date: string; start_time: string; end_time: string; room_id: string }>) => {
    requestsList.forEach((req) => {
      createShiftRequestMutation.mutate({
        studio_id: account?.studio_id,
        model_id: account.id,
        requested_date: req.date,
        start_time: req.start_time,
        end_time: req.end_time,
        preferred_room_id: req.room_id && req.room_id !== "none" ? req.room_id : null,
        status: "pending",
      });
    });
    setRequestModalOpen(false);
  };

  const handleApproveRequest = async (req: ShiftRequest) => {
    // Create the actual shift from the request
    const selectedDate = parseISO(req.requested_date);
    const [startH, startM] = req.start_time.split(":").map(Number);
    const [endH, endM] = req.end_time.split(":").map(Number);
    const startDateTime = new Date(selectedDate);
    startDateTime.setHours(startH, startM, 0);
    const endDateTime = new Date(selectedDate);
    endDateTime.setHours(endH, endM, 0);

    // Find the model's assignment to get operator
    const modelAssignment = assignments.find((a) => a.model_id === req.model_id);
    const modelAccount = allAccounts.find((a) => a.id === req.model_id);

    const shiftData = {
      model_id: req.model_id,
      operator_id: modelAssignment?.operator_id || (modelAccount?.works_alone ? req.model_id : account.id),
      room_id: req.preferred_room_id || null,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
      status: "scheduled" as const,
    };

    createShiftMutation.mutate(shiftData);
    updateShiftRequestMutation.mutate({
      id: req.id,
      data: { status: "approved" },
    });
    const modelName = modelAccount?.first_name || "Model";
    toast.success(`Approved shift for ${modelName}`);
  };

  const handleRejectRequest = (req: ShiftRequest) => {
    updateShiftRequestMutation.mutate({
      id: req.id,
      data: { status: "rejected" },
    });
    const modelAccount = allAccounts.find((a) => a.id === req.model_id);
    const modelName = modelAccount?.first_name || "Model";
    toast.success(`Rejected shift request from ${modelName}`);
  };

  // Filter shift requests relevant to this user
  const relevantRequests = shiftRequests.filter((r) => {
    if (isAdmin) return true;
    if (userRole === "operator") {
      const assignedModelIds = assignments.filter((a) => String(a.operator_id) === String(account.id)).map((a) => String(a.model_id));
      return assignedModelIds.includes(String(r.model_id));
    }
    if (userRole === "model") return r.model_id === account.id;
    return false;
  });

  const canReviewRequests = isAdmin || userRole === "operator";

  const getModelName = (modelId: string) => {
    const acc = allAccounts.find((a) => a.id === modelId);
    return acc?.first_name || "Unknown";
  };

  const getRoomName = (roomId: string | null) => {
    if (!roomId) return null;
    const room = rooms.find((r) => r.id === roomId);
    return room?.name || null;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {shiftsError && (
        <Card className="bg-red-500/[0.06] border-red-500/10">
          <CardContent className="p-3 sm:p-4">
            <p className="text-red-400 text-xs sm:text-sm">
              Failed to load shifts: {shiftsError instanceof Error ? shiftsError.message : "Unknown error"}
            </p>
          </CardContent>
        </Card>
      )}
      {!shiftsLoading && !shiftsError && shifts.length === 0 && (
        <Card className="bg-yellow-500/[0.06] border-yellow-500/10">
          <CardContent className="p-3 sm:p-4">
            <p className="text-yellow-400/80 text-xs">
              Debug: 0 shifts loaded. Studio ID: {account?.studio_id || "none"}. This banner will be removed once scheduling works.
            </p>
          </CardContent>
        </Card>
      )}

      {userRole === "model" && !isModelWorksAlone && (
        <Card className="bg-[#C9A84C]/[0.06] border-[#C9A84C]/10">
          <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:justify-between">
            <p className="text-[#C9A84C]/80 text-xs sm:text-sm">
              Your schedule is managed by your operator. You can request shifts for next week.
            </p>
            <Button
              onClick={() => setRequestModalOpen(true)}
              className="bg-[#C9A84C] hover:bg-[#B8973B] text-black w-full sm:w-auto sm:ml-4"
              size="sm"
            >
              <CalendarPlus className="w-4 h-4 mr-1" />
              Request Shifts
            </Button>
          </CardContent>
        </Card>
      )}

      {isModelWorksAlone && userRole === "model" && (
        <Card className="bg-purple-500/[0.06] border-purple-500/10">
          <CardContent className="p-4">
            <p className="text-purple-300 text-sm">
              You work independently -- you can create and manage your own shifts directly.
            </p>
          </CardContent>
        </Card>
      )}

      {relevantRequests.length > 0 && (
        <ShiftRequestsList
          requests={relevantRequests}
          canReview={canReviewRequests}
          onApprove={handleApproveRequest}
          onReject={handleRejectRequest}
        />
      )}

      <ShiftCalendar
        shifts={shifts}
        models={models}
        onAddShift={handleAddShift}
        onEditShift={handleEditShift}
        canEdit={canEdit}
        isLocked={isLocked}
        currentUserId={account.id}
        userRole={isAdmin ? "admin" : userRole}
        rooms={rooms}
      />

      {/* Mobile schedule navigation + add shift */}
      <div className="md:hidden">
        <Card className="bg-[#111111]/80 border-white/[0.04]">
          <CardHeader className="pb-3 border-b border-white/[0.04]">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium text-white">Shifts</CardTitle>
              {canEdit && !isLocked && (
                <Button onClick={handleAddShift} size="sm" className="bg-[#C9A84C] hover:bg-[#B8973B] text-black">
                  <CalendarPlus className="w-4 h-4 mr-1" /> Add
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="space-y-2">
              {filteredShifts.length === 0 ? (
                <p className="text-sm text-[#A8A49A]/40 text-center py-6">No shifts found</p>
              ) : (
                filteredShifts.slice(0, 20).map((shift) => (
                  <div
                    key={shift.id}
                    onClick={() => canEdit && !isLocked && handleEditShift(shift)}
                    className={`p-3 bg-white/[0.03] rounded-lg ${canEdit && !isLocked ? "cursor-pointer active:bg-white/[0.06]" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-white text-sm">{getModelName(shift.model_id)}</p>
                      <Badge className={`text-[10px] ${
                        shift.status === "completed" ? "bg-emerald-500/20 text-emerald-400" :
                        shift.status === "no_show" ? "bg-red-500/20 text-red-400" :
                        "bg-amber-500/20 text-amber-400"
                      }`}>
                        {shift.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[#A8A49A]/40">
                      <span>{new Date(shift.start_time).toLocaleDateString()}</span>
                      <span>{"\u2022"}</span>
                      <span>{new Date(shift.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - {new Date(shift.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    {getRoomName(shift.room_id) && (
                      <p className="text-xs text-[#A8A49A]/30 mt-0.5">{getRoomName(shift.room_id)}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {canEdit && (
        <ShiftModal
          open={modalOpen}
          onClose={() => { setModalOpen(false); setSelectedShift(null); }}
          onSave={handleSaveShift}
          onDelete={handleDeleteShift}
          shift={selectedShift}
          models={models}
          operators={operators}
          rooms={rooms}
          assignments={assignments}
          existingShifts={shifts}
          isAdmin={isAdmin}
          currentUserId={account.id}
          userRole={isAdmin ? "admin" : userRole}
          isModelWorksAlone={isModelWorksAlone}
        />
      )}

      {userRole === "model" && !isModelWorksAlone && (
        <ShiftRequestModal
          open={requestModalOpen}
          onClose={() => setRequestModalOpen(false)}
          onSubmit={handleSubmitRequests}
          rooms={rooms}
        />
      )}
      {ConfirmDialogEl}
    </div>
  );
}
