"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface Account {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  is_active: boolean;
}

interface Room {
  id: string;
  name: string;
  is_active: boolean;
}

interface Shift {
  id: string;
  model_id: string;
  operator_id: string | null;
  room_id: string | null;
  start_time: string;
  end_time: string;
  status: string;
}

interface ShiftModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shift?: Shift | null;
  accounts: Account[];
  rooms: Room[];
  selectedDate?: Date;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export function ShiftModal({
  open,
  onOpenChange,
  shift,
  accounts,
  rooms,
  selectedDate,
  onSave,
  onDelete,
}: ShiftModalProps) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    model_id: "",
    operator_id: "",
    room_id: "",
    date: format(new Date(), "yyyy-MM-dd"),
    start_time: "09:00",
    end_time: "17:00",
    status: "scheduled",
  });

  const models = accounts.filter((a) => a.role === "model" && a.is_active);
  const operators = accounts.filter((a) => a.role === "operator" && a.is_active);
  const activeRooms = rooms.filter((r) => r.is_active !== false);
  const isEditing = !!shift;

  useEffect(() => {
    if (shift) {
      const startDate = new Date(shift.start_time);
      const endDate = new Date(shift.end_time);
      setFormData({
        model_id: shift.model_id,
        operator_id: shift.operator_id || "",
        room_id: shift.room_id || "",
        date: format(startDate, "yyyy-MM-dd"),
        start_time: format(startDate, "HH:mm"),
        end_time: format(endDate, "HH:mm"),
        status: shift.status || "scheduled",
      });
    } else {
      setFormData({
        model_id: "",
        operator_id: "",
        room_id: "",
        date: selectedDate ? format(selectedDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
        start_time: "09:00",
        end_time: "17:00",
        status: "scheduled",
      });
    }
  }, [shift, selectedDate, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.model_id) return;

    setSaving(true);
    try {
      const startTime = new Date(`${formData.date}T${formData.start_time}:00`).toISOString();
      const endTime = new Date(`${formData.date}T${formData.end_time}:00`).toISOString();

      const payload: Record<string, unknown> = {
        model_id: formData.model_id,
        operator_id: formData.operator_id || null,
        room_id: formData.room_id || null,
        start_time: startTime,
        end_time: endTime,
        status: formData.status,
      };

      if (shift) {
        payload.id = shift.id;
      }

      await onSave(payload);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!shift || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(shift.id);
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">
            {isEditing ? "Edit Shift" : "Create Shift"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Model */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#A8A49A]/60">Model *</Label>
            <Select
              value={formData.model_id}
              onValueChange={(v) => v !== null && setFormData({ ...formData, model_id: v })}
            >
              <SelectTrigger className="bg-[#0A0A0A] border-white/[0.06] text-white">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/[0.08]">
                {models.map((m) => (
                  <SelectItem key={m.id} value={m.id} className="text-white">
                    {m.first_name || ""} {m.last_name || ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Operator */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#A8A49A]/60">Operator</Label>
            <Select
              value={formData.operator_id}
              onValueChange={(v) => v !== null && setFormData({ ...formData, operator_id: v })}
            >
              <SelectTrigger className="bg-[#0A0A0A] border-white/[0.06] text-white">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/[0.08]">
                <SelectItem value="" className="text-white">None</SelectItem>
                {operators.map((op) => (
                  <SelectItem key={op.id} value={op.id} className="text-white">
                    {op.first_name || ""} {op.last_name || ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Room */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#A8A49A]/60">Room</Label>
            <Select
              value={formData.room_id}
              onValueChange={(v) => v !== null && setFormData({ ...formData, room_id: v })}
            >
              <SelectTrigger className="bg-[#0A0A0A] border-white/[0.06] text-white">
                <SelectValue placeholder="No room" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/[0.08]">
                <SelectItem value="" className="text-white">No room</SelectItem>
                {activeRooms.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="text-white">
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[#A8A49A]/60">Date</Label>
            <Input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="bg-[#0A0A0A] border-white/[0.06] text-white"
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#A8A49A]/60">Start Time</Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="bg-[#0A0A0A] border-white/[0.06] text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#A8A49A]/60">End Time</Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="bg-[#0A0A0A] border-white/[0.06] text-white"
              />
            </div>
          </div>

          {/* Status (edit only) */}
          {isEditing && (
            <div className="space-y-1.5">
              <Label className="text-xs text-[#A8A49A]/60">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => v !== null && setFormData({ ...formData, status: v })}
              >
                <SelectTrigger className="bg-[#0A0A0A] border-white/[0.06] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/[0.08]">
                  <SelectItem value="scheduled" className="text-white">Scheduled</SelectItem>
                  <SelectItem value="completed" className="text-white">Completed</SelectItem>
                  <SelectItem value="no_show" className="text-white">No Show</SelectItem>
                  <SelectItem value="cancelled" className="text-white">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                disabled={deleting || saving}
                className="text-red-400 border-red-500/20 hover:bg-red-500/10 bg-transparent"
              >
                {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Delete
              </Button>
            )}
            <div className="flex-1" />
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-[#A8A49A]/60"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving || !formData.model_id}
              className="bg-[#C9A84C] hover:bg-[#b8963f] text-black"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
