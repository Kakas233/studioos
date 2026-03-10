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
import { Building2, Plus, Edit2, Trash2, Users, UserPlus, X } from "lucide-react";
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
            <Card className="col-span-full bg-[#111111]/80 border-white/[0.04]">
              <CardContent className="py-12 text-center">
                <Building2 className="w-12 h-12 mx-auto text-white/30 mb-4" />
                <p className="text-white/60">No rooms created yet</p>
                <Button onClick={handleAddRoom} variant="link" className="text-[#C9A84C] mt-2">Add your first room</Button>
              </CardContent>
            </Card>
          ) : (
            rooms.map((room) => {
              const roomAssignments = getAssignedModels(room.id);
              return (
                <Card key={room.id} className="bg-[#111111]/80 border-white/[0.04] overflow-hidden">
                  <div className={`h-1 ${room.is_active !== false ? "bg-green-500" : "bg-gray-300"}`} />
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-[#C9A84C]" />{room.name}
                      </CardTitle>
                      <Badge variant="outline" className={room.is_active !== false ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/[0.05] text-white/40 border-white/[0.08]"}>
                        {room.is_active !== false ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2 text-sm">
                        <Users className="w-4 h-4 text-white/40 mt-0.5" />
                        <div className="flex-1">
                          {roomAssignments.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {roomAssignments.map((a) => (
                                <Badge key={a.id} variant="outline" className="bg-white/[0.03] text-white flex items-center gap-1 pr-1">
                                  {getModelName(a.model_id)}
                                  <button onClick={() => handleRemoveFromRoom(a.id)} className="ml-1 hover:text-red-600 rounded-full">
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-white/70">No models assigned</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenAssignModel(room.id)} className="flex-1">
                          <UserPlus className="w-4 h-4 mr-1" />Assign Model
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEditRoom(room)} className="flex-1">
                          <Edit2 className="w-4 h-4 mr-1" />Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteRoom(room.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-white/[0.06]">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
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
            <SelectValue placeholder="Choose a model..." />
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
