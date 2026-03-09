"use client";

import { useState } from "react";
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
import { Loader2, AlertCircle } from "lucide-react";

interface InviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (data: {
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    cut_percentage?: number;
  }) => Promise<void>;
}

export function InviteModal({ open, onOpenChange, onInvite }: InviteModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "model",
    cut_percentage: 50,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.first_name) {
      setError("Email and first name are required");
      return;
    }

    setSaving(true);
    try {
      await onInvite({
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        cut_percentage: formData.role === "model" ? formData.cut_percentage : undefined,
      });
      setFormData({ email: "", first_name: "", last_name: "", role: "model", cut_percentage: 50 });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invite");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Invite Team Member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#A8A49A]/60">First Name *</Label>
              <Input
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="bg-[#0A0A0A] border-white/[0.06] text-white"
                placeholder="Jane"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#A8A49A]/60">Last Name</Label>
              <Input
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="bg-[#0A0A0A] border-white/[0.06] text-white"
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-[#A8A49A]/60">Email *</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-[#0A0A0A] border-white/[0.06] text-white"
              placeholder="jane@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-[#A8A49A]/60">Role *</Label>
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
              <p className="text-[10px] text-[#A8A49A]/30">
                The percentage of earnings the model keeps
              </p>
            </div>
          )}

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
              Send Invite
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
