"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus, User, Clock } from "lucide-react";
import {
  format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval,
  parseISO, isSameDay,
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
    return { top: `${top}%`, height: `${height}%` };
  };

  const statusColors: Record<string, string> = {
    scheduled: "bg-amber-500 border-amber-600",
    completed: "bg-emerald-500 border-emerald-600",
    no_show: "bg-red-500 border-red-600",
    cancelled: "bg-red-500/20 border-red-600",
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
            Week of {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={selectedRoom} onValueChange={(v) => v !== null && setSelectedRoom(v)}>
              <SelectTrigger className="w-32 sm:w-40 bg-white/[0.04] border-white/[0.06] text-white text-xs sm:text-sm">
                <SelectValue placeholder="Filter by Room" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rooms</SelectItem>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isLocked && (
              <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">Locked</Badge>
            )}
            <Button variant="ghost" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))} className="text-[#A8A49A]/60 hover:text-[#e8e6e3] hover:bg-white/[0.06]">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentWeek(addWeeks(new Date(), 1))} className="text-[#A8A49A]/60 hover:text-white hover:bg-white/[0.06] text-xs">
              Next Week
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))} className="text-[#A8A49A]/60 hover:text-[#e8e6e3] hover:bg-white/[0.06]">
              <ChevronRight className="w-4 h-4" />
            </Button>
            {canEdit && !isLocked && (
              <Button onClick={onAddShift} className="bg-[#C9A84C] hover:bg-[#B8973B] text-black ml-2">
                <Plus className="w-4 h-4 mr-1" /> Add Shift
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-auto">
          <div className="min-w-[1000px]">
            <div className="grid grid-cols-8 border-b border-white/[0.04] bg-white/[0.02]">
              <div className="p-3 text-center text-sm font-medium text-[#A8A49A]/40">Time</div>
              {days.map((day) => (
                <div key={day.toISOString()} className="p-3 text-center border-l border-white/[0.04]">
                  <p className="text-sm font-medium text-white">{format(day, "EEE")}</p>
                  <p className="text-xs text-[#A8A49A]/40">{format(day, "MMM d")}</p>
                </div>
              ))}
            </div>

            <div className="relative">
              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-8 h-12 border-b border-white/[0.02]">
                  <div className="p-1 text-right text-xs text-[#A8A49A]/30 pr-2">
                    {format(new Date(new Date().setHours(hour, 0)), "ha")}
                  </div>
                  {days.map((day) => (
                    <div key={`${day.toISOString()}-${hour}`} className="border-l border-white/[0.02]" />
                  ))}
                </div>
              ))}

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

                      if (!visible) {
                        return (
                          <div key={shift.id}
                            className="absolute left-1 right-1 rounded-lg border-l-4 border-[#A8A49A]/20 bg-white/[0.03] px-2 py-1 text-left text-xs cursor-default"
                            style={pos}>
                            <p className="font-bold text-[9px] text-[#A8A49A]/40 uppercase tracking-wide">BOOKED</p>
                            <p className="text-[10px] text-[#A8A49A]/30">
                              {format(start, "HH:mm")} - {format(end, "HH:mm")}
                            </p>
                          </div>
                        );
                      }

                      if (shift.status === "cancelled") {
                        return (
                          <button key={shift.id}
                            onClick={() => userRole === "admin" && !isLocked && onEditShift(shift)}
                            className={`absolute left-1 right-1 rounded-lg border-l-4 ${statusColors.cancelled} px-2 py-1 text-left text-xs shadow-sm ${userRole === "admin" && !isLocked ? "cursor-pointer hover:scale-[1.02]" : "cursor-default"}`}
                            style={pos}>
                            <p className="font-bold text-red-400">CANCELLED</p>
                            <p className="font-medium text-red-400/70 text-[10px] truncate">{getModelName(shift.model_id)}</p>
                          </button>
                        );
                      }

                      return (
                        <button key={shift.id}
                          onClick={() => editable && !isLocked && onEditShift(shift)}
                          className={`absolute left-1 right-1 rounded-lg border-l-4 px-2 py-1 text-left text-white text-xs shadow-sm transition-transform hover:scale-[1.02] ${statusColors[shift.status]} ${editable && !isLocked ? "cursor-pointer" : "cursor-default"}`}
                          style={pos}>
                          <p className="font-bold text-[9px] uppercase tracking-wide opacity-90">{shift.status.replace("_", " ")}</p>
                          <p className="font-medium text-[11px] truncate">{getModelName(shift.model_id)}</p>
                          <p className="opacity-80 text-[10px]">{format(start, "HH:mm")} - {format(end, "HH:mm")}</p>
                          {getRoomName(shift.room_id) && <p className="opacity-70 text-[10px] truncate">{getRoomName(shift.room_id)}</p>}
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
