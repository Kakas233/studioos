"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval,
  parseISO, isSameDay, isToday,
} from "date-fns";
import { useStudioAccounts } from "@/hooks/use-studio-data";
import type { Database } from "@/lib/supabase/types";

type Shift = Database["public"]["Tables"]["shifts"]["Row"];
type Room = Database["public"]["Tables"]["rooms"]["Row"];

interface ShiftCalendarProps {
  shifts: Shift[];
  models: Database["public"]["Tables"]["accounts"]["Row"][];
  onAddShift: () => void;
  onEditShift: (shift: Shift) => void;
  canEdit: boolean;
  isLocked: boolean;
  currentUserId: string;
  userRole: string;
  rooms?: Room[];
}

const statusStyles: Record<string, { bg: string; border: string; text: string; label: string }> = {
  scheduled: {
    bg: "bg-[#C9A84C]/[0.08]",
    border: "border-l-[#C9A84C]/60",
    text: "text-[#C9A84C]",
    label: "text-[#C9A84C]/50",
  },
  completed: {
    bg: "bg-emerald-500/[0.08]",
    border: "border-l-emerald-400/60",
    text: "text-emerald-300",
    label: "text-emerald-400/50",
  },
  no_show: {
    bg: "bg-red-500/[0.08]",
    border: "border-l-red-400/60",
    text: "text-red-300",
    label: "text-red-400/50",
  },
  cancelled: {
    bg: "bg-white/[0.02]",
    border: "border-l-white/10",
    text: "text-white/30",
    label: "text-white/20",
  },
  pending_approval: {
    bg: "bg-amber-500/[0.06]",
    border: "border-l-amber-400/40",
    text: "text-amber-300",
    label: "text-amber-400/40",
  },
};

export default function ShiftCalendar({
  shifts, models, onAddShift, onEditShift, canEdit, isLocked, currentUserId, userRole, rooms = [],
}: ShiftCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(addWeeks(new Date(), 1));
  const [selectedRoom, setSelectedRoom] = useState("all");
  const { data: accounts = [] } = useStudioAccounts();

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const hours = Array.from({ length: 16 }, (_, i) => i + 8);

  const filteredShiftsByRoom = selectedRoom === "all"
    ? shifts : shifts.filter((s) => s.room_id === selectedRoom);

  const getModelName = (modelId: string) => {
    const account = accounts.find((a) => a.id === modelId);
    return account?.first_name || "Unknown";
  };

  const getRoomName = (roomId: string | null) => {
    if (!roomId) return null;
    const room = rooms.find((r) => r.id === roomId);
    return room?.name || null;
  };

  const getShiftPosition = (shift: Shift) => {
    const start = parseISO(shift.start_time);
    const end = parseISO(shift.end_time);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const top = ((startHour - 8) / 16) * 100;
    const height = ((endHour - startHour) / 16) * 100;
    return { top: `${Math.max(0, top)}%`, height: `${Math.min(100 - Math.max(0, top), Math.max(height, 3))}%` };
  };

  const isShiftVisible = (shift: Shift) => {
    if (userRole === "admin") return true;
    if (userRole === "operator") return shift.operator_id === currentUserId;
    if (userRole === "model") return shift.model_id === currentUserId;
    return false;
  };

  const canEditShift = (shift: Shift) => {
    if (!canEdit) return false;
    if (userRole === "admin") return true;
    if (userRole === "operator") return shift.operator_id === currentUserId;
    if (userRole === "model") return shift.model_id === currentUserId;
    return false;
  };

  return (
    <Card className="bg-[#111111]/80 border-white/[0.04] overflow-hidden hidden md:block">
      <CardHeader className="pb-3 border-b border-white/[0.04]">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base sm:text-lg font-medium text-white">
            Week of {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={selectedRoom} onValueChange={(v) => v !== null && setSelectedRoom(v)}>
              <SelectTrigger className="w-32 sm:w-40 bg-white/[0.04] border-white/[0.06] text-white text-xs sm:text-sm">
                <span className="truncate">{selectedRoom === "all" ? "All Rooms" : (rooms.find((r) => r.id === selectedRoom)?.name || "Filter by Room")}</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isLocked && (
              <Badge variant="outline" className="bg-red-500/10 text-red-300 border-red-500/20 text-xs">Locked</Badge>
            )}
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))} className="text-[#A8A49A]/40 hover:text-white hover:bg-white/[0.06] h-8 w-8">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCurrentWeek(addWeeks(new Date(), 1))} className="text-[#A8A49A]/50 hover:text-white hover:bg-white/[0.06] text-xs h-8 px-3">
                Next Week
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))} className="text-[#A8A49A]/40 hover:text-white hover:bg-white/[0.06] h-8 w-8">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            {canEdit && !isLocked && (
              <Button onClick={onAddShift} size="sm" className="bg-[#C9A84C] hover:bg-[#B8973B] text-black h-8 px-3 text-xs font-medium">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Shift
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-auto">
          <div className="min-w-[1000px]">
            {/* Day headers */}
            <div className="grid grid-cols-8 border-b border-white/[0.06]">
              <div className="p-3 text-center text-xs font-medium text-[#A8A49A]/30 uppercase tracking-wider">Time</div>
              {days.map((day) => {
                const today = isToday(day);
                return (
                  <div key={day.toISOString()} className={`p-3 text-center border-l border-white/[0.04] ${today ? "bg-[#C9A84C]/[0.04]" : ""}`}>
                    <p className={`text-xs font-medium uppercase tracking-wide ${today ? "text-[#C9A84C]" : "text-white/70"}`}>{format(day, "EEE")}</p>
                    <p className={`text-[11px] mt-0.5 ${today ? "text-[#C9A84C]/60" : "text-[#A8A49A]/30"}`}>{format(day, "MMM d")}</p>
                  </div>
                );
              })}
            </div>

            {/* Time grid */}
            <div className="relative">
              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-8 h-12 border-b border-white/[0.03]">
                  <div className="flex items-start justify-end pr-3 pt-1">
                    <span className="text-[10px] text-[#A8A49A]/25 font-medium tabular-nums">
                      {format(new Date(new Date().setHours(hour, 0)), "ha")}
                    </span>
                  </div>
                  {days.map((day) => (
                    <div key={`${day.toISOString()}-${hour}`} className={`border-l border-white/[0.03] ${isToday(day) ? "bg-[#C9A84C]/[0.02]" : ""}`} />
                  ))}
                </div>
              ))}

              {/* Shift overlays */}
              <div className="absolute inset-0 grid grid-cols-8 pointer-events-none">
                <div />
                {days.map((day) => (
                  <div key={day.toISOString()} className="relative pointer-events-auto">
                    {filteredShiftsByRoom.filter((shift) => {
                      const shiftStart = parseISO(shift.start_time);
                      return isSameDay(shiftStart, day);
                    }).map((shift) => {
                      const pos = getShiftPosition(shift);
                      const start = parseISO(shift.start_time);
                      const end = parseISO(shift.end_time);
                      const visible = isShiftVisible(shift);
                      const editable = canEditShift(shift);
                      const style = statusStyles[shift.status] || statusStyles.scheduled;

                      if (!visible) {
                        return (
                          <div key={shift.id}
                            className="absolute left-1 right-1 rounded-md border-l-2 border-l-white/[0.08] bg-white/[0.02] px-2.5 py-1.5 text-left cursor-default"
                            style={pos}>
                            <p className="text-[10px] font-medium text-white/20 uppercase tracking-wide">Booked</p>
                            <p className="text-[10px] text-white/15 mt-0.5">
                              {format(start, "HH:mm")} – {format(end, "HH:mm")}
                            </p>
                          </div>
                        );
                      }

                      return (
                        <button key={shift.id}
                          onClick={() => editable && !isLocked && onEditShift(shift)}
                          className={`absolute left-1 right-1 rounded-md border-l-2 ${style.bg} ${style.border} px-2.5 py-1.5 text-left transition-colors ${editable && !isLocked ? "cursor-pointer hover:brightness-125" : "cursor-default"}`}
                          style={pos}>
                          <p className={`text-[11px] font-medium truncate ${style.text}`}>
                            {getModelName(shift.model_id)}
                          </p>
                          <p className={`text-[10px] mt-0.5 ${style.label}`}>
                            {format(start, "HH:mm")} – {format(end, "HH:mm")}
                          </p>
                          {getRoomName(shift.room_id) && (
                            <p className={`text-[9px] mt-0.5 truncate ${style.label}`}>{getRoomName(shift.room_id)}</p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
