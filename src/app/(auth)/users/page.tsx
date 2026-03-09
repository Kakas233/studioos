"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useStudioAccounts } from "@/hooks/use-studio-data";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, UserPlus, Search, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InviteModal } from "@/components/users/invite-modal";
import { EditUserDialog } from "@/components/users/edit-user-dialog";

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-[#C9A84C]/20 text-[#C9A84C] border-[#C9A84C]/30",
  admin: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  operator: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  model: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  accountant: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

export default function UsersPage() {
  const { isAdmin } = useAuth();
  const { data: accounts = [], isLoading } = useStudioAccounts();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<typeof accounts[0] | null>(null);

  const filteredAccounts = accounts.filter((acc) => {
    const name = `${acc.first_name || ""} ${acc.last_name || ""} ${acc.email || ""}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const activeAccounts = filteredAccounts.filter((a) => a.is_active);
  const inactiveAccounts = filteredAccounts.filter((a) => !a.is_active);

  const handleInvite = useCallback(async (data: {
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    cut_percentage?: number;
  }) => {
    const res = await fetch("/api/auth/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to send invite");
    }
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
  }, [queryClient]);

  const handleEditSave = useCallback(async (id: string, data: Record<string, unknown>) => {
    const res = await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    if (!res.ok) throw new Error("Failed to update user");
    queryClient.invalidateQueries({ queryKey: ["accounts"] });
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A49A]/40" />
          <Input
            placeholder="Search team members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#111111] border-white/[0.04] text-white placeholder:text-[#A8A49A]/30"
          />
        </div>
        {isAdmin && (
          <Button
            onClick={() => setInviteOpen(true)}
            className="bg-[#C9A84C] hover:bg-[#b8963f] text-black font-medium"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-3">
          <p className="text-[10px] text-[#A8A49A]/40 mb-1">Total Members</p>
          <p className="text-lg font-semibold text-white">{accounts.length}</p>
        </div>
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-3">
          <p className="text-[10px] text-[#A8A49A]/40 mb-1">Active</p>
          <p className="text-lg font-semibold text-emerald-400">
            {accounts.filter((a) => a.is_active).length}
          </p>
        </div>
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-3">
          <p className="text-[10px] text-[#A8A49A]/40 mb-1">Models</p>
          <p className="text-lg font-semibold text-pink-400">
            {accounts.filter((a) => a.role === "model").length}
          </p>
        </div>
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-3">
          <p className="text-[10px] text-[#A8A49A]/40 mb-1">Operators</p>
          <p className="text-lg font-semibold text-blue-400">
            {accounts.filter((a) => a.role === "operator").length}
          </p>
        </div>
      </div>

      {/* Active Members Table */}
      <div className="bg-[#111111] border border-white/[0.04] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.04]">
          <p className="text-sm font-medium text-white">
            Active Members ({activeAccounts.length})
          </p>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {activeAccounts.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[#A8A49A]/30">
              No members found.
            </div>
          )}
          {activeAccounts.map((acc) => (
            <div
              key={acc.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center text-xs font-medium text-white shrink-0">
                {(acc.first_name?.charAt(0) || "?").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">
                  {acc.first_name || ""} {acc.last_name || ""}
                </p>
                <p className="text-xs text-[#A8A49A]/40 truncate">{acc.email}</p>
              </div>
              {acc.role === "model" && acc.cut_percentage != null && (
                <span className="text-[10px] text-[#A8A49A]/30">{acc.cut_percentage}%</span>
              )}
              <Badge
                variant="outline"
                className={`text-[10px] capitalize ${ROLE_COLORS[acc.role || ""] || "bg-white/[0.04] text-[#A8A49A]/40"}`}
              >
                {acc.role}
              </Badge>
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-[#A8A49A]/30 hover:text-white shrink-0"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-[#1a1a1a] border-white/[0.08]">
                    <DropdownMenuItem
                      className="text-white"
                      onClick={() => {
                        setEditingAccount(acc);
                        setEditOpen(true);
                      }}
                    >
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-400"
                      onClick={() => handleEditSave(acc.id, { is_active: false })}
                    >
                      Deactivate
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Inactive Members */}
      {inactiveAccounts.length > 0 && (
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/[0.04]">
            <p className="text-sm font-medium text-[#A8A49A]/60">
              Inactive Members ({inactiveAccounts.length})
            </p>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {inactiveAccounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center gap-3 px-4 py-3 opacity-50"
              >
                <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center text-xs font-medium text-[#A8A49A]/40 shrink-0">
                  {(acc.first_name?.charAt(0) || "?").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-[#A8A49A]/60 truncate">
                    {acc.first_name || ""} {acc.last_name || ""}
                  </p>
                  <p className="text-xs text-[#A8A49A]/30 truncate">{acc.email}</p>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-white/[0.02] text-[#A8A49A]/30 border-white/[0.04]"
                >
                  {acc.role}
                </Badge>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditSave(acc.id, { is_active: true })}
                    className="text-xs text-[#A8A49A]/40 hover:text-emerald-400"
                  >
                    Reactivate
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <InviteModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvite={handleInvite}
      />
      <EditUserDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        account={editingAccount}
        onSave={handleEditSave}
      />
    </div>
  );
}
