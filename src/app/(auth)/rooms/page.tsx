"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useRooms, useStudioAccounts } from "@/hooks/use-studio-data";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Building2, MoreVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function RoomsPage() {
  const { isAdmin } = useAuth();
  const { data: rooms = [], isLoading: roomsLoading } = useRooms();
  const { data: accounts = [], isLoading: accountsLoading } = useStudioAccounts();
  const queryClient = useQueryClient();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingRoom, setEditingRoom] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreate = useCallback(async () => {
    if (!newRoomName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newRoomName.trim() }),
      });
      if (res.ok) {
        setNewRoomName("");
        setShowCreateForm(false);
        queryClient.invalidateQueries({ queryKey: ["rooms"] });
      }
    } finally {
      setCreating(false);
    }
  }, [newRoomName, queryClient]);

  const handleUpdate = useCallback(async (id: string, data: Record<string, unknown>) => {
    await fetch("/api/rooms", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    queryClient.invalidateQueries({ queryKey: ["rooms"] });
    setEditingRoom(null);
  }, [queryClient]);

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/rooms?id=${id}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: ["rooms"] });
  }, [queryClient]);

  const isLoading = roomsLoading || accountsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#A8A49A]/40">
            {rooms.length} room{rooms.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-[#C9A84C] hover:bg-[#b8963f] text-black font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Room
          </Button>
        )}
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-[#111111] border border-[#C9A84C]/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Input
              placeholder="Room name (e.g. Studio A, Room 1)"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="bg-[#0A0A0A] border-white/[0.06] text-white flex-1"
              autoFocus
            />
            <Button
              onClick={handleCreate}
              disabled={creating || !newRoomName.trim()}
              className="bg-[#C9A84C] hover:bg-[#b8963f] text-black"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowCreateForm(false);
                setNewRoomName("");
              }}
              className="text-[#A8A49A]/40 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Rooms Grid */}
      {rooms.length === 0 ? (
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-12 text-center">
          <Building2 className="w-10 h-10 text-[#A8A49A]/20 mx-auto mb-3" />
          <p className="text-sm text-[#A8A49A]/40 mb-1">No rooms configured yet</p>
          <p className="text-xs text-[#A8A49A]/25">
            Add rooms to organize your studio workspace and assign them to shifts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rooms.map((room) => {
            const activeModels = accounts.filter(
              (a) => a.role === "model" && a.is_active
            );
            const isEditing = editingRoom === room.id;

            return (
              <div
                key={room.id}
                className="bg-[#111111] border border-white/[0.04] rounded-xl p-4 hover:border-white/[0.08] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4 text-[#C9A84C]" />
                    </div>
                    <div className="min-w-0">
                      {isEditing ? (
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdate(room.id, { name: editName });
                            if (e.key === "Escape") setEditingRoom(null);
                          }}
                          onBlur={() => handleUpdate(room.id, { name: editName })}
                          className="h-7 text-sm bg-[#0A0A0A] border-white/[0.06] text-white"
                          autoFocus
                        />
                      ) : (
                        <p className="text-sm font-medium text-white">{room.name}</p>
                      )}
                      <Badge
                        variant="outline"
                        className={`text-[9px] mt-0.5 ${
                          room.is_active !== false
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {room.is_active !== false ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                  {isAdmin && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-[#A8A49A]/30 hover:text-white h-7 w-7 shrink-0"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-[#1a1a1a] border-white/[0.08]">
                        <DropdownMenuItem
                          className="text-white"
                          onClick={() => {
                            setEditingRoom(room.id);
                            setEditName(room.name);
                          }}
                        >
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-white"
                          onClick={() =>
                            handleUpdate(room.id, { is_active: room.is_active === false })
                          }
                        >
                          {room.is_active !== false ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-400"
                          onClick={() => handleDelete(room.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <div className="pt-3 border-t border-white/[0.04]">
                  <p className="text-[10px] text-[#A8A49A]/30 mb-1.5">
                    Studio Models ({activeModels.length})
                  </p>
                  <div className="flex -space-x-1.5">
                    {activeModels.slice(0, 5).map((model) => (
                      <div
                        key={model.id}
                        className="w-6 h-6 rounded-full bg-white/[0.08] border border-[#111111] flex items-center justify-center text-[9px] text-white"
                        title={`${model.first_name || ""} ${model.last_name || ""}`}
                      >
                        {(model.first_name?.charAt(0) || "?").toUpperCase()}
                      </div>
                    ))}
                    {activeModels.length > 5 && (
                      <div className="w-6 h-6 rounded-full bg-white/[0.04] border border-[#111111] flex items-center justify-center text-[9px] text-[#A8A49A]/40">
                        +{activeModels.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
