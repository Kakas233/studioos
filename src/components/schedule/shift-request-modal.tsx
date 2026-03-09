"use client";

import { useState } from "react";
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
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { format, startOfWeek, addWeeks, endOfWeek, parseISO, isWithinInterval } from "date-fns";
import type { Database } from "@/lib/supabase/types";

type Room = Database["public"]["Tables"]["rooms"]["Row"];

interface ShiftRequest {
  date: string;
  start_time: string;
  end_time: string;
  room_id: string;
}

interface ShiftRequestModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (requests: ShiftRequest[]) => void;
  rooms?: Room[];
}

export default function ShiftRequestModal({ open, onClose, onSubmit, rooms = [] }: ShiftRequestModalProps) {
  const nextWeekStart = startOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });
  const nextWeekEnd = endOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });

  const [requests, setRequests] = useState<ShiftRequest[]>([{
    date: format(nextWeekStart, "yyyy-MM-dd"),
    start_time: "09:00",
    end_time: "11:00",
    room_id: "",
  }]);
  const [errors, setErrors] = useState<string[]>([]);

  const addRequest = () => {
    setRequests([...requests, {
      date: format(nextWeekStart, "yyyy-MM-dd"),
      start_time: "09:00",
      end_time: "11:00",
      room_id: "",
    }]);
  };

  const removeRequest = (index: number) => {
    if (requests.length > 1) {
      setRequests(requests.filter((_, i) => i !== index));
    }
  };

  const updateRequest = (index: number, field: keyof ShiftRequest, value: string) => {
    const updated = [...requests];
    updated[index] = { ...updated[index], [field]: value };
    setRequests(updated);
  };

  const handleSubmit = () => {
    const validationErrors: string[] = [];
    requests.forEach((req, i) => {
      const date = parseISO(req.date);
      if (!isWithinInterval(date, { start: nextWeekStart, end: nextWeekEnd })) {
        validationErrors.push(`Request ${i + 1}: Date must be within next week (${format(nextWeekStart, "MMM d")} - ${format(nextWeekEnd, "MMM d")})`);
      }
      const [sh, sm] = req.start_time.split(":").map(Number);
      const [eh, em] = req.end_time.split(":").map(Number);
      const durationMin = (eh * 60 + em) - (sh * 60 + sm);
      if (durationMin < 120) {
        validationErrors.push(`Request ${i + 1}: Shift must be at least 2 hours`);
      }
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSubmit(requests);
    setRequests([{
      date: format(nextWeekStart, "yyyy-MM-dd"),
      start_time: "09:00",
      end_time: "11:00",
      room_id: "",
    }]);
    setErrors([]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] bg-[#111111] border-white/[0.06] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Request Shifts for Next Week</DialogTitle>
        </DialogHeader>

        {errors.length > 0 && (
          <Alert variant="destructive" className="bg-red-500/10 border-red-500/20">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc pl-4">
                {errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <p className="text-sm text-[#A8A49A]/40">
          Request one or more shifts for {format(nextWeekStart, "MMM d")} {"\u2013"} {format(nextWeekEnd, "MMM d")}. Your operator or admin will approve them.
        </p>

        <div className="space-y-4">
          {requests.map((req, index) => (
            <div key={index} className="p-4 bg-white/[0.03] rounded-lg border border-white/[0.04] space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-white">Shift {index + 1}</p>
                {requests.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => removeRequest(index)} className="text-red-400 hover:bg-red-500/10">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={req.date}
                  min={format(nextWeekStart, "yyyy-MM-dd")}
                  max={format(nextWeekEnd, "yyyy-MM-dd")}
                  onChange={(e) => updateRequest(index, "date", e.target.value)}
                  className="bg-white/[0.04] border-white/[0.06] text-white [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Start</Label>
                  <Input type="time" value={req.start_time}
                    onChange={(e) => updateRequest(index, "start_time", e.target.value)}
                    className="bg-white/[0.04] border-white/[0.06] text-white [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70" />
                </div>
                <div className="space-y-2">
                  <Label>End</Label>
                  <Input type="time" value={req.end_time}
                    onChange={(e) => updateRequest(index, "end_time", e.target.value)}
                    className="bg-white/[0.04] border-white/[0.06] text-white [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-70" />
                </div>
              </div>
              {rooms.length > 0 && (
                <div className="space-y-2">
                  <Label>Preferred Room (optional)</Label>
                  <Select value={req.room_id} onValueChange={(v) => v !== null && updateRequest(index, "room_id", v)}>
                    <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white"><SelectValue placeholder="Any room" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Any room</SelectItem>
                      {rooms.filter((r) => r.is_active !== false).map((room) => (
                        <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          ))}

          <Button variant="outline" onClick={addRequest} className="w-full border-dashed">
            <Plus className="w-4 h-4 mr-1" /> Add Another Shift
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-[#C9A84C] hover:bg-[#B8973B] text-black">
            Submit {requests.length} Request{requests.length > 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
