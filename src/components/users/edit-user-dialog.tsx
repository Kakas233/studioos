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
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";

interface Account {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: string;
  is_active: boolean;
  cut_percentage: number | null;
  weekly_goal_hours: number | null;
  weekly_goal_enabled: boolean | null;
  works_alone: boolean | null;
}

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account: Account | null;
  onSave: (id: string, data: Record<string, unknown>) => Promise<void>;
}

export function EditUserDialog({ open, onOpenChange, account, onSave }: EditUserDialogProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    role: "model",
    is_active: true,
    cut_percentage: 50,
    weekly_goal_hours: 30,
    weekly_goal_enabled: false,
    works_alone: false,
  });

  useEffect(() => {
    if (account) {
      setFormData({
        first_name: account.first_name || "",
        last_name: account.last_name || "",
        role: account.role,
        is_active: account.is_active,
        cut_percentage: account.cut_percentage ?? 50,
        weekly_goal_hours: account.weekly_goal_hours ?? 30,
        weekly_goal_enabled: account.weekly_goal_enabled ?? false,
        works_alone: account.works_alone ?? false,
      });
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return;

    setSaving(true);
    try {
      await onSave(account.id, formData);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  if (!account) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#A8A49A]/60">First Name</Label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="bg-[#0A0A0A] border-white/[0.06] text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#A8A49A]/60">Last Name</Label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="bg-[#0A0A0A] border-white/[0.06] text-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-[#A8A49A]/60">Email</Label>
            <Input
              value={account.email}
              disabled
              className="bg-[#0A0A0A] border-white/[0.06] text-[#A8A49A]/40"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-[#A8A49A]/60">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(v) => v !== null && setFormData({ ...formData, role: v })}
            >
              <SelectTrigger className="bg-[#0A0A0A] border-white/[0.06] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/[0.08]">
                <SelectItem value="model" className="text-white">Model</SelectItem>
                <SelectItem value="operator" className="text-white">Operator</SelectItem>
                <SelectItem value="admin" className="text-white">Admin</SelectItem>
                <SelectItem value="accountant" className="text-white">Accountant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.role === "model" && (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#A8A49A]/60">Cut Percentage (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={formData.cut_percentage}
                  onChange={(e) => setFormData({ ...formData, cut_percentage: Number(e.target.value) })}
                  className="bg-[#0A0A0A] border-white/[0.06] text-white"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2.5">
                <div>
                  <p className="text-xs text-white">Works Alone</p>
                  <p className="text-[10px] text-[#A8A49A]/30">Model doesn&apos;t need an operator</p>
                </div>
                <Switch
                  checked={formData.works_alone}
                  onCheckedChange={(v) => setFormData({ ...formData, works_alone: v })}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2.5">
                <div>
                  <p className="text-xs text-white">Weekly Goal</p>
                  <p className="text-[10px] text-[#A8A49A]/30">Track weekly streaming hours</p>
                </div>
                <Switch
                  checked={formData.weekly_goal_enabled}
                  onCheckedChange={(v) => setFormData({ ...formData, weekly_goal_enabled: v })}
                />
              </div>

              {formData.weekly_goal_enabled && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#A8A49A]/60">Weekly Goal (hours)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={168}
                    value={formData.weekly_goal_hours}
                    onChange={(e) => setFormData({ ...formData, weekly_goal_hours: Number(e.target.value) })}
                    className="bg-[#0A0A0A] border-white/[0.06] text-white"
                  />
                </div>
              )}
            </>
          )}

          <div className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2.5">
            <div>
              <p className="text-xs text-white">Active</p>
              <p className="text-[10px] text-[#A8A49A]/30">Deactivate to revoke access</p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
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
              disabled={saving}
              className="bg-[#C9A84C] hover:bg-[#b8963f] text-black"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
