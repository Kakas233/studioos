"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRooms, useAssignments, useStudioAccounts } from "@/hooks/use-studio-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit2, Trash2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import FeatureGate from "@/components/shared/feature-gate";
import { useConfirmDialog } from "@/components/shared/confirm-dialog";
import { createClient } from "@/lib/supabase/client";

export default function RoomsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { account, loading: authLoading } = useAuth();
  const supabase = createClient();
  const userRole = account?.role || "model";
  const isAdmin = userRole === "admin" || userRole === "owner";

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);

  const { data: rooms = [] } = useRooms();
  const { data: assignments = [] } = useAssignments();
  const { data: allAccounts = [] } = useStudioAccounts();
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignRoomId, setAssignRoomId] = useState<string | null>(null);

  const { confirm, ConfirmDialogEl } = useConfirmDialog();
  const models = allAccounts.filter((u) => u.role === "model" && u.is_active !== false);

  // Helper to get model name by ID
  const getModelName = (id: string) => {
    const model = allAccounts.find((a) => a.id === id);
    return model?.first_name || "Unknown";
  };

  const createAssignmentMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const { error } = await supabase.from("assignments").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Model assigned to room");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to assign model"),
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const { error } = await supabase.from("assignments").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Assignment updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update assignment"),
  });

  const removeAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assignments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Model unassigned");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to remove assignment"),
  });

  const createRoomMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const { error } = await supabase.from("rooms").insert({ ...data, studio_id: account?.studio_id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setModalOpen(false);
      setSelectedRoom(null);
      toast.success("Room created");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create room"),
  });

  const updateRoomMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const { error } = await supabase.from("rooms").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      setModalOpen(false);
      setSelectedRoom(null);
      toast.success("Room updated");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update room"),
  });

  const deleteRoomMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rooms").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      toast.success("Room deleted");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to delete room"),
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!account || !isAdmin) {
    router.push("/dashboard");
    return null;
  }

  const getAssignedModels = (roomId: string) => assignments.filter((a) => a.room_id === roomId);
  const handleOpenAssignModel = (roomId: string) => { setAssignRoomId(roomId); setAssignModalOpen(true); };
  const handleAssignModel = (modelId: string) => {
    const model = models.find((m) => m.id === modelId);
    const room = rooms.find((r) => r.id === assignRoomId);
    if (!model || !room) return;

    const existingAssignment = assignments.find((a) => a.model_id === modelId);
    const assignmentData = {
      studio_id: account?.studio_id,
      operator_id: existingAssignment?.operator_id || modelId,
      model_id: modelId,
      room_id: assignRoomId,
    };

    if (existingAssignment) {
      updateAssignmentMutation.mutate({ id: existingAssignment.id, data: assignmentData });
    } else {
      createAssignmentMutation.mutate(assignmentData);
    }
    setAssignModalOpen(false);
  };
  const handleRemoveFromRoom = async (assignmentId: string) => {
    const ok = await confirm({ title: "Remove Model", description: "Remove this model from the room?", confirmLabel: "Remove", variant: "destructive" });
    if (ok) removeAssignmentMutation.mutate(assignmentId);
  };
  const handleAddRoom = () => { setSelectedRoom(null); setModalOpen(true); };
  const handleEditRoom = (room: any) => { setSelectedRoom(room); setModalOpen(true); };
  const handleDeleteRoom = async (roomId: string) => {
    const ok = await confirm({ title: "Delete Room", description: "Are you sure you want to delete this room?", confirmLabel: "Delete", variant: "destructive" });
    if (ok) deleteRoomMutation.mutate(roomId);
  };
  const handleSaveRoom = (roomData: Record<string, unknown>) => {
    if (selectedRoom) { updateRoomMutation.mutate({ id: selectedRoom.id, data: roomData }); }
    else { createRoomMutation.mutate(roomData); }
  };

  return (
    <FeatureGate requiredTier="starter">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Room Management</h2>
            <p className="text-white/60 text-sm hidden sm:block">Manage studio rooms and their assignments</p>
          </div>
          <Button onClick={handleAddRoom} size="sm" className="bg-[#C9A84C] hover:bg-[#B8973B] text-black shrink-0">
            <Plus className="w-4 h-4 mr-1" />Add Room
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <p className="text-sm text-[#A8A49A]/40">No rooms created yet</p>
              <button onClick={handleAddRoom} className="text-sm text-[#C9A84C] hover:underline mt-2">Add your first room</button>
            </div>
          ) : (
            rooms.map((room) => {
              const roomAssignments = getAssignedModels(room.id);
              return (
                <div key={room.id} className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${room.is_active !== false ? "bg-emerald-400" : "bg-[#A8A49A]/20"}`} />
                      <p className="text-sm font-medium text-white">{room.name}</p>
                    </div>
                    <span className="text-[10px] text-[#A8A49A]/40">
                      {room.is_active !== false ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="mb-3">
                    {roomAssignments.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {roomAssignments.map((a) => (
                          <span key={a.id} className="inline-flex items-center gap-1 text-xs text-white bg-white/[0.04] border border-white/[0.06] rounded-md px-2 py-1">
                            {getModelName(a.model_id)}
                            <button onClick={() => handleRemoveFromRoom(a.id)} className="text-[#A8A49A]/30 hover:text-red-400 transition-colors">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#A8A49A]/30">No models assigned</p>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-white/[0.04]">
                    <button onClick={() => handleOpenAssignModel(room.id)} className="flex-1 text-xs text-[#A8A49A]/50 hover:text-white transition-colors py-1.5">
                      Assign
                    </button>
                    <button onClick={() => handleEditRoom(room)} className="flex-1 text-xs text-[#A8A49A]/50 hover:text-white transition-colors py-1.5">
                      Edit
                    </button>
                    <button onClick={() => handleDeleteRoom(room.id)} className="text-xs text-[#A8A49A]/30 hover:text-red-400 transition-colors py-1.5 px-2">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-[400px] bg-[#111111] border-white/[0.06]">
            <DialogHeader><DialogTitle className="text-white">{selectedRoom ? "Edit Room" : "Add Room"}</DialogTitle></DialogHeader>
            <RoomForm room={selectedRoom} onSave={handleSaveRoom} onClose={() => { setModalOpen(false); setSelectedRoom(null); }} />
          </DialogContent>
        </Dialog>

        <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
          <DialogContent className="sm:max-w-[400px] bg-[#111111] border-white/[0.06]">
            <DialogHeader><DialogTitle className="text-white">Assign Model to Room</DialogTitle></DialogHeader>
            <AssignModelToRoom
              models={models}
              existingAssignments={assignments}
              roomId={assignRoomId}
              onAssign={handleAssignModel}
              onClose={() => setAssignModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
      {ConfirmDialogEl}
    </FeatureGate>
  );
}

function AssignModelToRoom({
  models,
  existingAssignments,
  roomId,
  onAssign,
  onClose,
}: {
  models: any[];
  existingAssignments: any[];
  roomId: string | null;
  onAssign: (modelId: string) => void;
  onClose: () => void;
}) {
  const [selectedModelId, setSelectedModelId] = useState("");
  // Show models not already assigned to this room
  const alreadyAssignedIds = existingAssignments.filter((a) => a.room_id === roomId).map((a) => a.model_id);
  const availableModels = models.filter((m) => !alreadyAssignedIds.includes(m.id));

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Select Model</Label>
        <Select value={selectedModelId} onValueChange={(v) => v !== null && setSelectedModelId(v)}>
          <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white">
            <span className="truncate">{selectedModelId ? (availableModels.find((m) => m.id === selectedModelId)?.first_name || "Choose a model...") : "Choose a model..."}</span>
          </SelectTrigger>
          <SelectContent>
            {availableModels.map((m) => (
              <SelectItem key={m.id} value={m.id}>{m.first_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {availableModels.length === 0 && (
          <p className="text-xs text-white/50">All models are already assigned to this room.</p>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onAssign(selectedModelId)} disabled={!selectedModelId} className="bg-[#C9A84C] hover:bg-[#B8973B] text-black">
          Assign
        </Button>
      </DialogFooter>
    </div>
  );
}

function RoomForm({ room, onSave, onClose }: { room: any; onSave: (data: Record<string, unknown>) => void; onClose: () => void }) {
  const [name, setName] = useState(room?.name || "");
  const [isActive, setIsActive] = useState(room?.is_active !== false);

  const handleSubmit = () => {
    if (!name.trim()) { toast.error("Please enter a room name"); return; }
    onSave({ name: name.trim(), is_active: isActive });
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Room Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Room 1, Studio A" className="bg-white/[0.04] border-white/[0.06] text-white" />
      </div>
      <div className="flex items-center justify-between">
        <Label>Active</Label>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} className="bg-[#C9A84C] hover:bg-[#B8973B] text-black">{room ? "Update" : "Create"} Room</Button>
      </DialogFooter>
    </div>
  );
}
