"use client";

import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useShifts, useStudioAccounts, useRooms } from "@/hooks/use-studio-data";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShiftModal } from "@/components/schedule/shift-modal";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isSameDay,
  parseISO,
} from "date-fns";

export default function SchedulePage() {
  const { account, isAdmin, role } = useAuth();
  const userRole = role || "owner";
  const queryClient = useQueryClient();

  const { data: shifts = [], isLoading: shiftsLoading } = useShifts();
  const { data: accounts = [], isLoading: accountsLoading } = useStudioAccounts();
  const { data: rooms = [], isLoading: roomsLoading } = useRooms();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<typeof shifts[0] | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const filteredShifts = useMemo(() => {
    return shifts.filter((shift) => {
      if (isAdmin) return true;
      if (userRole === "operator") return shift.operator_id === account?.id;
      if (userRole === "model") return shift.model_id === account?.id;
      return false;
    });
  }, [shifts, isAdmin, userRole, account?.id]);

  const getShiftsForDay = (day: Date) => {
    return filteredShifts.filter((shift) => {
      try {
        return isSameDay(parseISO(shift.start_time), day);
      } catch {
        return false;
      }
    });
  };

  const getAccountName = (id: string | null) => {
    if (!id) return "Unassigned";
    const acc = accounts.find((a) => a.id === id);
    return acc ? `${acc.first_name || ""} ${acc.last_name || ""}`.trim() : "Unknown";
  };

  const getRoomName = (id: string | null) => {
    if (!id) return "";
    const room = rooms.find((r) => r.id === id);
    return room?.name || "";
  };

  const handleSaveShift = useCallback(async (data: Record<string, unknown>) => {
    const isUpdate = !!data.id;
    const res = await fetch("/api/shifts", {
      method: isUpdate ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to save shift");
    }
    queryClient.invalidateQueries({ queryKey: ["shifts"] });
  }, [queryClient]);

  const handleDeleteShift = useCallback(async (id: string) => {
    const res = await fetch(`/api/shifts?id=${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete shift");
    queryClient.invalidateQueries({ queryKey: ["shifts"] });
  }, [queryClient]);

  const openCreateShift = (day?: Date) => {
    setSelectedShift(null);
    setSelectedDate(day);
    setShiftModalOpen(true);
  };

  const openEditShift = (shift: typeof shifts[0]) => {
    setSelectedShift(shift);
    setSelectedDate(undefined);
    setShiftModalOpen(true);
  };

  const isLoading = shiftsLoading || accountsLoading || roomsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Week Navigation */}
      <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
          className="text-[#A8A49A]/60 hover:text-white"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#C9A84C]" />
          <span className="text-white font-medium">
            {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              onClick={() => openCreateShift()}
              className="bg-[#C9A84C] hover:bg-[#b8963f] text-black font-medium text-xs"
              size="sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Shift
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
            className="text-[#A8A49A]/60 hover:text-white"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayShifts = getShiftsForDay(day);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={`bg-[#111111] border rounded-xl p-3 min-h-[120px] ${
                isToday ? "border-[#C9A84C]/30" : "border-white/[0.04]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p
                  className={`text-xs font-medium ${
                    isToday ? "text-[#C9A84C]" : "text-[#A8A49A]/40"
                  }`}
                >
                  {format(day, "EEE d")}
                </p>
                {isAdmin && (
                  <button
                    onClick={() => openCreateShift(day)}
                    className="w-4 h-4 rounded flex items-center justify-center text-[#A8A49A]/20 hover:text-[#C9A84C] hover:bg-[#C9A84C]/10 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                {dayShifts.length === 0 && (
                  <p className="text-[10px] text-[#A8A49A]/20">No shifts</p>
                )}
                {dayShifts.map((shift) => (
                  <button
                    key={shift.id}
                    onClick={() => openEditShift(shift)}
                    className={`w-full text-left rounded-lg px-2 py-1.5 text-[10px] transition-colors hover:ring-1 hover:ring-white/10 ${
                      shift.status === "completed"
                        ? "bg-emerald-500/10 text-emerald-400"
                        : shift.status === "in_progress"
                          ? "bg-blue-500/10 text-blue-400"
                          : shift.status === "cancelled"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-white/[0.04] text-[#A8A49A]/60"
                    }`}
                  >
                    <p className="font-medium truncate">
                      {getAccountName(shift.model_id)}
                    </p>
                    {getRoomName(shift.room_id) && (
                      <p className="text-[9px] opacity-60 truncate">
                        {getRoomName(shift.room_id)}
                      </p>
                    )}
                    <p className="text-[9px] opacity-60">
                      {format(parseISO(shift.start_time), "HH:mm")} -{" "}
                      {format(parseISO(shift.end_time), "HH:mm")}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-4">
        <p className="text-xs text-[#A8A49A]/40 mb-2">Week Summary</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-lg font-semibold text-white">
              {filteredShifts.filter((s) =>
                weekDays.some((d) => {
                  try { return isSameDay(parseISO(s.start_time), d); } catch { return false; }
                })
              ).length}
            </p>
            <p className="text-[10px] text-[#A8A49A]/40">Total Shifts</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-emerald-400">
              {filteredShifts.filter((s) =>
                s.status === "completed" && weekDays.some((d) => {
                  try { return isSameDay(parseISO(s.start_time), d); } catch { return false; }
                })
              ).length}
            </p>
            <p className="text-[10px] text-[#A8A49A]/40">Completed</p>
          </div>
          <div>
            <p className="text-lg font-semibold text-blue-400">
              {filteredShifts.filter((s) =>
                s.status === "scheduled" && weekDays.some((d) => {
                  try { return isSameDay(parseISO(s.start_time), d); } catch { return false; }
                })
              ).length}
            </p>
            <p className="text-[10px] text-[#A8A49A]/40">Scheduled</p>
          </div>
        </div>
      </div>

      {/* Shift Modal */}
      <ShiftModal
        open={shiftModalOpen}
        onOpenChange={setShiftModalOpen}
        shift={selectedShift}
        accounts={accounts}
        rooms={rooms}
        selectedDate={selectedDate}
        onSave={handleSaveShift}
        onDelete={handleDeleteShift}
      />
    </div>
  );
}
