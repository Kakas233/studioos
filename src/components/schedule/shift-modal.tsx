"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Trash2 } from "lucide-react";
import {
  format, parseISO, differenceInMinutes, isWithinInterval,
  startOfWeek, endOfWeek, addWeeks, isSunday, isAfter, isBefore,
  setHours, setMinutes, isSameDay,
} from "date-fns";
import type { Database } from "@/lib/supabase/types";

type Account = Database["public"]["Tables"]["accounts"]["Row"];
type Room = Database["public"]["Tables"]["rooms"]["Row"];
type Shift = Database["public"]["Tables"]["shifts"]["Row"];
type Assignment = Database["public"]["Tables"]["assignments"]["Row"];

interface ShiftModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Record<string, unknown>) => void;
  onDelete?: (id: string) => void;
  shift: Shift | null;
  models: Account[];
  operators: Account[];
  rooms: Room[];
  assignments: Assignment[];
  existingShifts: Shift[];
  isAdmin?: boolean;
  currentUserId: string | null;
  userRole: string | null;
  isModelWorksAlone?: boolean;
}

export function ShiftModal({
  open, onClose, onSave, onDelete, shift, models, operators, rooms, assignments,
  existingShifts, isAdmin = false, currentUserId = null, userRole = null, isModelWorksAlone = false,
}: ShiftModalProps) {
  const [formData, setFormData] = useState({
    model_id: "",
    operator_id: "",
    room_id: "",
    date: "",
    start_time: "09:00",
    end_time: "11:00",
    status: "scheduled",
  });
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (shift) {
      const start = parseISO(shift.start_time);
      const end = parseISO(shift.end_time);
      setFormData({
        model_id: shift.model_id || "",
        operator_id: shift.operator_id || "",
        room_id: shift.room_id || "",
        date: format(start, "yyyy-MM-dd"),
        start_time: format(start, "HH:mm"),
        end_time: format(end, "HH:mm"),
        status: shift.status || "scheduled",
      });
    } else {
      const nextWeekStart = startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });
      setFormData({
        model_id: isModelWorksAlone ? (currentUserId || "") : "",
        operator_id: isModelWorksAlone ? (currentUserId || "") : (userRole === "operator" ? (currentUserId || "") : ""),
        room_id: "",
        date: format(nextWeekStart, "yyyy-MM-dd"),
        start_time: "09:00",
        end_time: "11:00",
        status: "scheduled",
      });
    }
    setErrors([]);
  }, [shift, open, currentUserId, userRole, isModelWorksAlone]);

  const validateShift = () => {
    const validationErrors: string[] = [];
    const now = new Date();
    const selectedDate = parseISO(formData.date);
    const nextWeekStart = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });
    const nextWeekEnd = endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });

    // Rule 1: Next week only (SKIP FOR ADMIN)
    if (!isAdmin && !isWithinInterval(selectedDate, { start: nextWeekStart, end: nextWeekEnd })) {
      validationErrors.push("Shifts can only be booked for next week");
    }

    // Rule 2: Sunday lock (SKIP FOR ADMIN)
    if (!isAdmin && isSunday(now) && isAfter(now, setHours(setMinutes(now, 59), 23))) {
      validationErrors.push("Editing is locked after Sunday 23:59");
    }

    // Parse times
    const [startH, startM] = formData.start_time.split(":").map(Number);
    const [endH, endM] = formData.end_time.split(":").map(Number);
    const startDateTime = setMinutes(setHours(selectedDate, startH), startM);
    const endDateTime = setMinutes(setHours(selectedDate, endH), endM);

    // Rule 3: 2-hour minimum
    const durationMinutes = differenceInMinutes(endDateTime, startDateTime);
    const duration = durationMinutes / 60;
    if (durationMinutes < 120) {
      validationErrors.push("Shift must be at least 2 hours");
    }

    // Rule 4: 8-hour max per day
    const modelDayShifts = existingShifts.filter((s) => {
      if (shift && s.id === shift.id) return false;
      return s.model_id === formData.model_id && isSameDay(parseISO(s.start_time), selectedDate);
    });
    const totalHoursToday = modelDayShifts.reduce((sum, s) => {
      return sum + differenceInMinutes(parseISO(s.end_time), parseISO(s.start_time)) / 60;
    }, 0);
    if (totalHoursToday + duration > 8) {
      validationErrors.push(`Model already has ${Math.round(totalHoursToday * 10) / 10}h today. Max 8h per day.`);
    }

    // Rule 5: Conflict check
    const conflictingShifts = existingShifts.filter((s) => {
      if (shift && s.id === shift.id) return false;
      const sStart = parseISO(s.start_time);
      const sEnd = parseISO(s.end_time);

      const hasOverlap =
        (isAfter(startDateTime, sStart) && isBefore(startDateTime, sEnd)) ||
        (isAfter(endDateTime, sStart) && isBefore(endDateTime, sEnd)) ||
        (isBefore(startDateTime, sStart) && isAfter(endDateTime, sEnd)) ||
        (startDateTime.getTime() === sStart.getTime());

      if (!hasOverlap) return false;

      if (s.model_id === formData.model_id) return true;
      if (s.operator_id === formData.operator_id) return true;
      if (formData.room_id && s.room_id === formData.room_id) return true;
      return false;
    });

    if (conflictingShifts.some((c) => c.model_id === formData.model_id)) {
      validationErrors.push("Model is already booked during this time");
    }
    const selModel = models.find((m) => m.id === formData.model_id);
    if (!selModel?.works_alone && conflictingShifts.some((c) => c.operator_id === formData.operator_id)) {
      validationErrors.push("Operator is already booked during this time");
    }
    if (formData.room_id && conflictingShifts.some((c) => c.room_id === formData.room_id)) {
      validationErrors.push("Room is already booked during this time");
    }

    return validationErrors;
  };

  const handleSave = () => {
    if (!formData.model_id || !formData.date) {
      setErrors(["Please fill in all required fields"]);
      return;
    }
    const selectedModel = models.find((m) => m.id === formData.model_id);

    // Determine operator: for "works alone" models, set to model_id
    const effectiveOperatorId =
      (isModelWorksAlone || selectedModel?.works_alone) && !formData.operator_id
        ? formData.model_id
        : formData.operator_id;

    if (!effectiveOperatorId) {
      setErrors(["Please select an operator"]);
      return;
    }

    const validationErrors = validateShift();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    const selectedDate = parseISO(formData.date);
    const [startH, startM] = formData.start_time.split(":").map(Number);
    const [endH, endM] = formData.end_time.split(":").map(Number);

    const shiftData = {
      model_id: formData.model_id,
      operator_id: effectiveOperatorId,
      room_id: formData.room_id || null,
      start_time: setMinutes(setHours(selectedDate, startH), startM).toISOString(),
      end_time: setMinutes(setHours(selectedDate, endH), endM).toISOString(),
      status: formData.status,
    };

    onSave(shiftData);
  };

  // Get assigned room for selected model
  const modelAssignment = assignments.find((a) => a.model_id === formData.model_id);
  const suggestedRoom = modelAssignment?.room_id;

  // Auto-fill room when model is selected (for operators)
  useEffect(() => {
    if (userRole === "operator" && formData.model_id && suggestedRoom) {
      setFormData((prev) => ({ ...prev, room_id: suggestedRoom }));
    }
  }, [formData.model_id, suggestedRoom, userRole]);

  const activeModels = useMemo(() => models.filter((m) => m.is_active !== false), [models]);
  const activeOperators = useMemo(() => operators.filter((o) => o.is_active !== false), [operators]);

  // For operators, filter models to only show assigned ones
  const availableModels = useMemo(() => {
    if (userRole === "operator") {
      const currentUserIdStr = String(currentUserId);
      const operatorAssignments = assignments.filter((a) => String(a.operator_id) === currentUserIdStr);
      const assignedModelIds = operatorAssignments.map((a) => String(a.model_id));
      return activeModels.filter((m) => assignedModelIds.includes(String(m.id)));
    }
    return activeModels;
  }, [userRole, assignments, currentUserId, activeModels]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-[#111111] border-white/[0.06]">
        <DialogHeader>
          <DialogTitle className="text-white">
            {shift ? "Edit Shift" : "Add New Shift"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {errors.length > 0 && (
            <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {isModelWorksAlone ? (
            <div className="p-3 bg-purple-500/[0.06] rounded-lg border border-purple-500/10">
              <p className="text-sm text-purple-300">Creating shift for yourself (works alone)</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label className="text-white/80">Model *</Label>
                <Select
                  value={formData.model_id}
                  onValueChange={(v) => {
                    if (v === null) return;
                    const selectedModel = models.find((m) => m.id === v);
                    if (selectedModel?.works_alone) {
                      setFormData({ ...formData, model_id: v, operator_id: v });
                    } else {
                      setFormData({ ...formData, model_id: v });
                    }
                  }}
                >
                  <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white">
                    <span className="truncate">{formData.model_id ? (models.find((m) => m.id === formData.model_id)?.first_name || "Select model") : "Select model"}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {`${model.first_name || ""}${model.works_alone ? " (solo)" : ""}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {(() => {
                const selectedModel = models.find((m) => m.id === formData.model_id);
                if (selectedModel?.works_alone) {
                  return (
                    <div className="p-3 bg-purple-500/[0.06] rounded-lg border border-purple-500/10">
                      <p className="text-sm text-purple-300">This model works alone -- no operator needed</p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-2">
                    <Label className="text-white/80">Operator *</Label>
                    <Select
                      value={formData.operator_id}
                      onValueChange={(v) => v !== null && setFormData({ ...formData, operator_id: v })}
                      disabled={userRole === "operator"}
                    >
                      <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white">
                        <span className="truncate">{formData.operator_id ? (operators.find((o) => o.id === formData.operator_id)?.first_name || "Select operator") : "Select operator"}</span>
                      </SelectTrigger>
                      <SelectContent>
                        {activeOperators.map((op) => (
                          <SelectItem key={op.id} value={op.id}>
                            {op.first_name || ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                );
              })()}
            </>
          )}

          <div className="space-y-2">
            <Label className="text-white/80">Room *</Label>
            <Select
              value={formData.room_id}
              onValueChange={(v) => v !== null && setFormData({ ...formData, room_id: v })}
              disabled={userRole === "operator" && !!formData.model_id}
            >
              <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white">
                <span className="truncate">{formData.room_id ? (rooms.find((r) => r.id === formData.room_id)?.name || "Select room") : "Select room"}</span>
              </SelectTrigger>
              <SelectContent>
                {rooms.filter((r) => r.is_active !== false).map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {userRole === "operator" && formData.model_id && (
              <p className="text-xs text-[#A8A49A]/40">
                Auto-assigned based on model
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-white/80">Date *</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="bg-white/[0.04] border-white/[0.06] text-white [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/80">Start Time *</Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="bg-white/[0.04] border-white/[0.06] text-white [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">End Time *</Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="bg-white/[0.04] border-white/[0.06] text-white [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70"
              />
            </div>
          </div>

          {shift && (
            <div className="space-y-2">
              <Label className="text-white/80">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => v !== null && setFormData({ ...formData, status: v })}
              >
                <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                  {isAdmin && <SelectItem value="cancelled">Cancelled</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          {shift && onDelete && (
            <Button
              variant="outline"
              onClick={() => onDelete(shift.id)}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-white/[0.06]"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-[#C9A84C] hover:bg-[#B8973B] text-black"
            >
              {shift ? "Update" : "Create"} Shift
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ShiftModal;
