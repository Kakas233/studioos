"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useStudioAccounts, useAssignments, useRooms } from "@/hooks/use-studio-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  UserPlus, Edit2, Link2, Trash2,
  Video, Loader2, Shuffle, Copy, Eye, EyeOff, HelpCircle,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import CamAccountsTab from "@/components/users/cam-accounts-tab";
import FeatureGate from "@/components/shared/feature-gate";
import { useConfirmDialog } from "@/components/shared/confirm-dialog";
import WeeklyGoalSettings from "@/components/users/weekly-goal-settings";
import { createClient } from "@/lib/supabase/client";
import { ROLE_COLORS } from "@/lib/config";

export default function UsersManagementPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { account, loading: authLoading } = useAuth();
  const supabase = createClient();

  const userRole = account?.role || "model";
  const isAdmin = userRole === "admin" || userRole === "owner";
  const { confirm, ConfirmDialogEl } = useConfirmDialog();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const { data: allAccounts = [] } = useStudioAccounts();
  const { data: assignments = [] } = useAssignments();
  const { data: rooms = [] } = useRooms();

  const createAssignmentMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const { error } = await supabase.from("assignments").insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      toast.success("Assignment created");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to create assignment"),
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

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assignments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
    onError: (error: Error) => toast.error(error.message || "Failed to delete assignment"),
  });

  useEffect(() => {
    if (!authLoading && (!account || !isAdmin)) {
      router.push(account ? "/dashboard" : "/sign-in");
    }
  }, [authLoading, account, isAdmin, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!account || !isAdmin) return null;

  const models = allAccounts.filter((u) => u.role === "model" && u.is_active !== false);
  const operators = allAccounts.filter((u) => u.role === "operator" && u.is_active !== false);

  const getAssignmentForModel = (modelId: string) => {
    return assignments.find((a) => a.model_id === modelId);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleAssignments = (model: any) => {
    setSelectedUser(model);
    setAssignmentModalOpen(true);
  };

  const handleSaveAssignment = (operatorId: string, roomId: string) => {
    const existingAssignment = getAssignmentForModel(selectedUser.id);
    const operator = operators.find((o) => o.id === operatorId);
    const room = rooms.find((r) => r.id === roomId);

    const assignmentData = {
      studio_id: account?.studio_id,
      operator_id: operatorId,
      model_id: selectedUser.id,
    };

    if (existingAssignment) {
      updateAssignmentMutation.mutate({ id: existingAssignment.id, data: assignmentData });
    } else {
      createAssignmentMutation.mutate(assignmentData);
    }

    setAssignmentModalOpen(false);
    setSelectedUser(null);
  };

  const deleteAccountMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const { error } = await supabase
        .from("accounts")
        .update({ is_active: false })
        .eq("id", accountId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Account deactivated successfully");
    },
    onError: () => {
      toast.error("Failed to deactivate account");
    },
  });

  const handleDeleteUser = async (user: any) => {
    if (user.id === account.id) {
      toast.error("You cannot deactivate your own account");
      return;
    }
    if (user.role === "owner") {
      toast.error("The studio owner account cannot be deactivated");
      return;
    }
    const ok = await confirm({ title: "Deactivate Account", description: "Are you sure you want to deactivate this account? They will lose access.", confirmLabel: "Deactivate", variant: "destructive" });
    if (ok) deleteAccountMutation.mutate(user.id);
  };

  // Helper to get operator name for a model assignment
  const getOperatorName = (operatorId: string | null) => {
    if (!operatorId) return "Unknown";
    const op = allAccounts.find((a) => a.id === operatorId);
    return op?.first_name || "Unknown";
  };

  // Helper to get room name for assignment
  const getRoomNameForAssignment = (assignment: any) => {
    if (!assignment?.room_id) return null;
    const room = rooms.find((r) => r.id === assignment.room_id);
    return room?.name || null;
  };

  return (
    <FeatureGate requiredTier="starter">
      {/* Users management requires Starter tier */}
      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#C9A84C] border border-[#C9A84C]/20 rounded-md hover:bg-[#C9A84C]/10 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Invite User
          </button>
        </div>

        <div className="rounded-lg border border-white/[0.04] overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white/[0.02]">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Cut %</TableHead>
                  <TableHead>Payout</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allAccounts.filter((a) => a.is_active !== false).map((u) => {
                  const assignment = getAssignmentForModel(u.id);

                  return (
                    <TableRow key={u.id} className="hover:bg-white/[0.02]">
                      <TableCell className="font-medium text-white">{u.first_name}</TableCell>
                      <TableCell className="text-white/60 text-xs">{u.email}</TableCell>
                      <TableCell>
                        <span className={`text-xs ${ROLE_COLORS[u.role] ? "text-white/70" : "text-white/50"}`}>
                          {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {(u.role === "model" || u.role === "operator") && (
                          <span className="text-xs text-white/50">{u.cut_percentage ?? 33}%</span>
                        )}
                        {(u.role === "admin" || u.role === "owner") && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-xs text-[#C9A84C]/70 cursor-help">{u.cut_percentage ?? 33}% studio</span>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-[220px] bg-[#1A1A1A] border-white/10 text-xs text-white">
                                <p>The studio&apos;s cut percentage applied per shift earnings.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-white/40">
                          {u.payout_method === "Cash" ? "Cash" : "Bank"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {u.role === "model" && u.works_alone && (
                          <span className="text-xs text-white/40">Solo</span>
                        )}
                        {u.role === "model" && !u.works_alone && assignment && (
                          <div>
                            <p className="text-xs text-white/70">{getOperatorName(assignment.operator_id)}</p>
                            <p className="text-[11px] text-white/30">{getRoomNameForAssignment(assignment) || "No room"}</p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-0.5">
                          <button
                            onClick={() => handleEditUser(u)}
                            aria-label={`Edit ${u.first_name}`}
                            className="p-1.5 text-white/30 hover:text-white/70 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {u.role === "model" && (
                            <button
                              onClick={() => handleAssignments(u)}
                              aria-label={`Manage assignments for ${u.first_name}`}
                              className="p-1.5 text-white/30 hover:text-white/70 transition-colors"
                            >
                              <Link2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {u.id !== account.id && u.role !== "owner" && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              aria-label={`Deactivate ${u.first_name}`}
                              className="p-1.5 text-white/20 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {allAccounts.filter((a) => a.is_active !== false).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <p className="text-sm text-[#A8A49A]/40">No team members yet</p>
                      <p className="text-xs text-[#A8A49A]/30 mt-1">Invite your first team member above</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <Dialog open={assignmentModalOpen} onOpenChange={setAssignmentModalOpen}>
          <DialogContent className="sm:max-w-[400px] bg-[#111111] border-white/[0.06]">
            <DialogHeader>
              <DialogTitle className="text-white">
                Assign {selectedUser?.first_name}
              </DialogTitle>
            </DialogHeader>
            <AssignmentForm
              model={selectedUser}
              operators={operators}
              rooms={rooms}
              existingAssignment={selectedUser ? getAssignmentForModel(selectedUser.id) : null}
              onSave={handleSaveAssignment}
              onClose={() => setAssignmentModalOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className={`bg-[#111111] border-white/[0.06] ${selectedUser?.role === "model" ? "sm:max-w-[500px]" : "sm:max-w-[400px]"}`}>
            <DialogHeader>
              <DialogTitle className="text-white">Edit {selectedUser?.first_name || "User"}</DialogTitle>
            </DialogHeader>
            {selectedUser?.role === "model" ? (
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/[0.05]">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="cam_accounts" className="flex items-center gap-1">
                    <Video className="w-3 h-3" />
                    Cam Accounts
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="details">
                  <EditUserForm
                    user={selectedUser}
                    onClose={() => {
                      setEditModalOpen(false);
                      setSelectedUser(null);
                    }}
                  />
                </TabsContent>
                <TabsContent value="cam_accounts">
                  <CamAccountsTab user={selectedUser} studioId={account?.studio_id} />
                </TabsContent>
              </Tabs>
            ) : (
              <EditUserForm
                user={selectedUser}
                onClose={() => {
                  setEditModalOpen(false);
                  setSelectedUser(null);
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent className="sm:max-w-[500px] bg-[#111111] border-white/[0.06]">
            <DialogHeader>
              <DialogTitle className="text-white">Invite New User</DialogTitle>
            </DialogHeader>
            <CreateUserForm
              studioId={account?.studio_id}
              onClose={() => setCreateModalOpen(false)}
            />
          </DialogContent>
        </Dialog>
      {ConfirmDialogEl}
      </div>
    </FeatureGate>
  );
}

function AssignmentForm({
  model,
  operators,
  rooms,
  existingAssignment,
  onSave,
  onClose,
}: {
  model: any;
  operators: any[];
  rooms: any[];
  existingAssignment: any;
  onSave: (operatorId: string, roomId: string) => void;
  onClose: () => void;
}) {
  const [operatorId, setOperatorId] = useState(existingAssignment?.operator_id || "");
  const [roomId, setRoomId] = useState(existingAssignment?.room_id || "");

  // Only show active operators
  const activeOperators = operators.filter((op) => op.is_active !== false);

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label className="text-white/80 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Assign to Operator</Label>
        <Select value={operatorId} onValueChange={(v) => v !== null && setOperatorId(v)}>
          <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white">
            <span className="truncate">{operatorId ? (activeOperators.find((op) => op.id === operatorId)?.first_name || "Select operator") : "Select operator"}</span>
          </SelectTrigger>
          <SelectContent>
            {activeOperators.map((op) => (
              <SelectItem key={op.id} value={op.id}>
                {op.first_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label className="text-white/80 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Assign Room</Label>
        <Select value={roomId} onValueChange={(v) => v !== null && setRoomId(v)}>
          <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white">
            <span className="truncate">{roomId ? (rooms.find((r) => r.id === roomId)?.name || "Select room") : "Select room"}</span>
          </SelectTrigger>
          <SelectContent>
            {rooms.map((room) => (
              <SelectItem key={room.id} value={room.id}>
                {room.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => onSave(operatorId, roomId)}
          className="bg-[#C9A84C] hover:bg-[#B8973B] text-black"
          disabled={!operatorId}
        >
          Save Assignment
        </Button>
      </DialogFooter>
    </div>
  );
}

function EditUserForm({ user, onClose }: { user: any; onClose: () => void }) {
  const queryClient = useQueryClient();
  const supabase = createClient();
  const [role, setRole] = useState(user?.role || "model");
  const [cutPercentage, setCutPercentage] = useState(user?.cut_percentage || 33);
  const [payoutMethod, setPayoutMethod] = useState(user?.payout_method || "Bank");
  const [worksAlone, setWorksAlone] = useState(user?.works_alone || false);
  const [newPassword, setNewPassword] = useState("");
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const updateAccountMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const { error } = await supabase
        .from("accounts")
        .update(data)
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("User updated successfully");
      onClose();
    },
    onError: (error: Error) => toast.error(error.message || "Failed to update user"),
  });

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account_id: user.id,
          new_password: newPassword,
        }),
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast.success(`Password updated for ${user.first_name}`);
        setNewPassword("");
        setShowPasswordSection(false);
      } else {
        toast.error(data.error || "Failed to reset password");
      }
    } catch {
      toast.error("Failed to reset password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSave = () => {
    if (user.role === "owner" && role !== "owner") {
      toast.error("Cannot change the studio owner's role");
      return;
    }
    if (role === "owner" && user.role !== "owner") {
      toast.error("Cannot assign the owner role");
      return;
    }
    const data: Record<string, unknown> = { role };
    if (role !== "accountant") {
      const clampedCut = Math.max(0, Math.min(100, Number(cutPercentage) || 0));
      data.cut_percentage = clampedCut;
      data.payout_method = payoutMethod;
    } else {
      data.cut_percentage = 0;
    }
    if (role === "model") {
      data.works_alone = worksAlone;
    }
    updateAccountMutation.mutate(data);
  };

  if (!user) return null;

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label className="text-white/80 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Role</Label>
        <Select value={role} onValueChange={(v) => v !== null && setRole(v)}>
          <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white"><SelectValue /></SelectTrigger>
          <SelectContent>
            {user?.role === "owner" && <SelectItem value="owner">Owner</SelectItem>}
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="operator">Operator</SelectItem>
            <SelectItem value="model">Model</SelectItem>
            <SelectItem value="accountant">Accountant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {role === "model" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border border-white/[0.06]">
            <div>
              <p className="text-sm text-white/80">Works Alone</p>
              <p className="text-xs text-[#A8A49A]/40 mt-0.5">
                Model manages own shifts without an operator
              </p>
            </div>
            <Switch
              checked={worksAlone}
              onCheckedChange={setWorksAlone}
            />
          </div>

          <WeeklyGoalSettings user={user} />
        </div>
      )}

      {role !== "accountant" && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label className="text-white/80 text-sm font-medium leading-none">
              {(role === "admin" || role === "owner") ? "Studio Cut %" : "Cut Percentage"}
            </Label>
            {(role === "admin" || role === "owner") && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-3.5 h-3.5 text-white/30 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[240px] bg-[#1A1A1A] border-white/10 text-xs text-white">
                    <p>The studio&apos;s percentage from each shift&apos;s earnings. Per shift: model gets their cut, operator gets their cut, and the studio keeps this percentage.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Input type="number" min="0" max="100" value={cutPercentage}
              onChange={(e) => setCutPercentage(Number(e.target.value))} className="bg-white/[0.04] border-white/[0.06] text-white" />
            <span className="text-xs text-white/40">%</span>
          </div>
        </div>
      )}
      {role !== "accountant" && (
        <div className="space-y-2">
          <Label className="text-white/80 text-sm font-medium leading-none">Payout Method</Label>
          <Select value={payoutMethod} onValueChange={(v) => v !== null && setPayoutMethod(v)}>
            <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Bank">Bank Transfer</SelectItem>
              <SelectItem value="Cash">Cash</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Password Reset Section */}
      <div className="border-t border-white/[0.06] pt-3">
        {!showPasswordSection ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPasswordSection(true)}
            className="bg-white/[0.04] text-[#A8A49A] px-3 text-xs font-medium rounded-md inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border shadow-sm h-8 w-full border-white/[0.08] hover:text-white hover:bg-white/[0.06]"
          >
            Reset Password
          </Button>
        ) : (
          <div className="space-y-2 p-3 rounded-lg border border-white/[0.06]">
            <p className="text-xs font-medium text-white/70">Set New Password</p>
            <Input
              type="password"
              placeholder="Min. 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-white/[0.04] border-white/[0.06] text-white h-8 text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleResetPassword}
                disabled={passwordLoading}
                className="bg-[#C9A84C] hover:bg-[#B8973B] text-black h-7 text-xs flex-1"
              >
                {passwordLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "Update Password"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setShowPasswordSection(false); setNewPassword(""); }}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} className="bg-[#C9A84C] hover:bg-[#B8973B] text-black">
          Save Changes
        </Button>
      </DialogFooter>
    </div>
  );
}

function CreateUserForm({ studioId, onClose }: { studioId: string; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { studio } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [role, setRole] = useState("model");
  const [cutPercentage, setCutPercentage] = useState(33);
  const [payoutMethod, setPayoutMethod] = useState("Bank");
  const [inviting, setInviting] = useState(false);

  const generateSecurePassword = () => {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghjkmnpqrstuvwxyz";
    const digits = "23456789";
    const symbols = "!@#$%&*";
    const all = upper + lower + digits + symbols;
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    // Ensure at least one of each category
    let pw = "";
    pw += upper[randomBytes[0] % upper.length];
    pw += lower[randomBytes[1] % lower.length];
    pw += digits[randomBytes[2] % digits.length];
    pw += symbols[randomBytes[3] % symbols.length];
    for (let i = 4; i < 16; i++) {
      pw += all[randomBytes[i] % all.length];
    }
    // Shuffle using crypto-random
    const shuffleBytes = new Uint8Array(pw.length);
    crypto.getRandomValues(shuffleBytes);
    const chars = pw.split("");
    chars.sort((a, b) => shuffleBytes[chars.indexOf(a)] - shuffleBytes[chars.indexOf(b)]);
    setPassword(chars.join(""));
    setShowPassword(true);
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(password);
    toast.success("Password copied");
  };

  const handleSubmit = async () => {
    if (!email || !password || !firstName) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setInviting(true);

    try {
      const payload: Record<string, unknown> = {
        email,
        password,
        first_name: firstName,
        role,
      };

      // Only include financials for non-accountant roles
      if (role !== "accountant") {
        payload.cut_percentage = cutPercentage;
        payload.payout_method = payoutMethod;
      }

      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || "Failed to invite user");
        setInviting(false);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      onClose();
      toast.success(data.message || `Invitation sent to ${email}`);
    } catch {
      toast.error("Failed to invite user");
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-4 p-4 bg-white/[0.03] rounded-lg border border-white/[0.06]">
        <p className="text-sm font-medium text-white">Login Details</p>
        <div className="space-y-2">
          <Label className="text-white/70">Email *</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="user@youragency.com" className="bg-white/[0.04] border-white/[0.06] text-white" />
        </div>
        <div className="space-y-2">
          <Label className="text-white/70">Password *</Label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="--------"
                className="bg-white/[0.04] border-white/[0.06] text-white pr-16"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 rounded hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                {password && (
                  <button
                    type="button"
                    onClick={copyPassword}
                    className="p-1.5 rounded hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateSecurePassword}
              className="shrink-0 text-[#C9A84C] border-[#C9A84C]/20 hover:bg-[#C9A84C]/10 text-xs gap-1"
            >
              <Shuffle className="w-3.5 h-3.5" />
              Generate
            </Button>
          </div>
          {password && showPassword && (
            <p className="text-xs text-white/40 font-mono break-all">{password}</p>
          )}
        </div>
      </div>
      <div className="space-y-4 p-4 bg-white/[0.03] rounded-lg border border-white/[0.06]">
        <p className="text-sm font-medium text-white">Profile Info</p>
        <div className="space-y-2">
          <Label className="text-white/70">First Name *</Label>
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)}
            placeholder="John" className="bg-white/[0.04] border-white/[0.06] text-white" />
        </div>
        <div className="space-y-2">
          <Label className="text-white/70">Role *</Label>
          <Select value={role} onValueChange={(v) => v !== null && setRole(v)}>
            <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="operator">Operator</SelectItem>
              <SelectItem value="model">Model</SelectItem>
              <SelectItem value="accountant">Accountant</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {role !== "accountant" && (
        <div className="space-y-4 p-4 bg-white/[0.03] rounded-lg border border-white/[0.06]">
          <p className="text-sm font-medium text-white">Financials</p>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-white/70">
                {(role === "admin") ? "Studio Cut %" : "Cut %"}
              </Label>
              {role === "admin" && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3.5 h-3.5 text-white/30 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[240px] bg-[#1A1A1A] border-white/10 text-xs text-white">
                      <p>The studio&apos;s percentage from each shift&apos;s earnings. Per shift: model gets their cut, operator gets their cut, and the studio keeps this percentage.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input type="number" min="0" max="100" value={cutPercentage}
                onChange={(e) => setCutPercentage(Number(e.target.value))} className="bg-white/[0.04] border-white/[0.06] text-white" />
              <span className="text-xs text-white/40">%</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Payout Method</Label>
            <Select value={payoutMethod} onValueChange={(v) => v !== null && setPayoutMethod(v)}>
              <SelectTrigger className="bg-white/[0.04] border-white/[0.06] text-white"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Bank">Bank Transfer</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={inviting} className="bg-[#C9A84C] hover:bg-[#B8973B] text-black">
          {inviting ? <><Loader2 className="w-4 h-4 animate-spin mr-1" />Inviting...</> : <><UserPlus className="w-4 h-4 mr-1" />Invite User</>}
        </Button>
      </DialogFooter>
    </div>
  );
}
