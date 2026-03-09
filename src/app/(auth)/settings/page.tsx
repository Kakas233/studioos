"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useGlobalSettings, useCamAccounts } from "@/hooks/use-studio-data";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Settings,
  Globe,
  Bell,
  Shield,
  Key,
  Save,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PLATFORMS } from "@/lib/platforms";
import { CURRENCIES } from "@/lib/currencies";

export default function SettingsPage() {
  const { studio, account, isAdmin } = useAuth();
  const { data: settings, isLoading: settingsLoading } = useGlobalSettings();
  const { data: camAccounts = [], isLoading: camLoading } = useCamAccounts();
  const queryClient = useQueryClient();

  const [saving, setSaving] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({ password: "", confirm: "" });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [studioEditing, setStudioEditing] = useState(false);
  const [studioName, setStudioName] = useState(studio?.name || "");
  const [timezone, setTimezone] = useState(
    studio?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  const [settingsEditing, setSettingsEditing] = useState(false);
  const [secondaryCurrency, setSecondaryCurrency] = useState(
    settings?.secondary_currency || "EUR"
  );
  const [exchangeRate, setExchangeRate] = useState(
    String(settings?.exchange_rate || "1")
  );

  const handleSaveStudio = useCallback(async () => {
    setSaving(true);
    try {
      // Update studio name via Supabase directly through global settings endpoint
      // as the studio update is handled by updating the studios table
      const res = await fetch("/api/global-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secondary_currency: secondaryCurrency,
          exchange_rate: parseFloat(exchangeRate) || 1,
        }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["globalSettings"] });
        setSettingsEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }, [secondaryCurrency, exchangeRate, queryClient]);

  const handleChangePassword = useCallback(async () => {
    setPasswordError("");
    if (passwordData.password.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    if (passwordData.password !== passwordData.confirm) {
      setPasswordError("Passwords don't match");
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordData.password }),
      });
      if (res.ok) {
        setShowPasswordDialog(false);
        setPasswordData({ password: "", confirm: "" });
      } else {
        const err = await res.json();
        setPasswordError(err.error || "Failed to update password");
      }
    } finally {
      setPasswordSaving(false);
    }
  }, [passwordData]);

  const isLoading = settingsLoading || camLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Studio Info */}
      <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#C9A84C]" />
            <h2 className="text-sm font-medium text-white">Studio Information</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-[#A8A49A]/40 mb-1 uppercase tracking-wider">
              Studio Name
            </p>
            <p className="text-sm text-white">{studio?.name || "Not set"}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#A8A49A]/40 mb-1 uppercase tracking-wider">
              Subscription
            </p>
            <Badge
              variant="outline"
              className="text-[10px] capitalize bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/20"
            >
              {studio?.subscription_tier || "free"}
            </Badge>
          </div>
          <div>
            <p className="text-[10px] text-[#A8A49A]/40 mb-1 uppercase tracking-wider">
              Default Currency
            </p>
            <p className="text-sm text-white uppercase">
              {studio?.primary_currency || "USD"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[#A8A49A]/40 mb-1 uppercase tracking-wider">
              Timezone
            </p>
            <p className="text-sm text-white">
              {studio?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
            </p>
          </div>
        </div>
      </div>

      {/* Financial Settings */}
      <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#C9A84C]" />
            <h2 className="text-sm font-medium text-white">Financial Settings</h2>
          </div>
          {isAdmin && !settingsEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsEditing(true)}
              className="text-xs border-white/[0.08] text-[#A8A49A]/60 hover:text-white bg-transparent"
            >
              Edit
            </Button>
          )}
        </div>

        {settingsEditing ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#A8A49A]/60">Secondary Currency</Label>
              <Select
                value={secondaryCurrency}
                onValueChange={(v) => v !== null && setSecondaryCurrency(v)}
              >
                <SelectTrigger className="bg-[#0A0A0A] border-white/[0.06] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/[0.08]">
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code} className="text-white">
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#A8A49A]/60">Exchange Rate (USD → {secondaryCurrency})</Label>
              <Input
                type="number"
                step="0.01"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                className="bg-[#0A0A0A] border-white/[0.06] text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveStudio}
                disabled={saving}
                className="bg-[#C9A84C] hover:bg-[#b8963f] text-black"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save
              </Button>
              <Button
                variant="ghost"
                onClick={() => setSettingsEditing(false)}
                className="text-[#A8A49A]/60"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-[#A8A49A]/40 mb-1 uppercase tracking-wider">
                Secondary Currency
              </p>
              <p className="text-sm text-white">{settings?.secondary_currency || "Not set"}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#A8A49A]/40 mb-1 uppercase tracking-wider">
                Exchange Rate
              </p>
              <p className="text-sm text-white">{settings?.exchange_rate || "1.00"}</p>
            </div>
          </div>
        )}
      </div>

      {/* Platform Connections */}
      <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#C9A84C]" />
            <h2 className="text-sm font-medium text-white">Platform Connections</h2>
          </div>
        </div>
        {camAccounts.length === 0 ? (
          <p className="text-xs text-[#A8A49A]/30">
            No cam platform accounts configured. Add platform connections from the Users page.
          </p>
        ) : (
          <div className="space-y-2">
            {camAccounts.map((ca) => {
              const platform = PLATFORMS[ca.platform];
              return (
                <div
                  key={ca.id}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: `${platform?.color || "#666"}20` }}
                    >
                      <Globe className="w-3.5 h-3.5" style={{ color: platform?.color || "#666" }} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">
                        {platform?.name || ca.platform}
                      </p>
                      <p className="text-[10px] text-[#A8A49A]/30">
                        {ca.username || "No username set"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[9px] ${
                      ca.is_active
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}
                  >
                    {ca.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Security */}
      <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4 text-[#C9A84C]" />
          <h2 className="text-sm font-medium text-white">Security</h2>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-2">
              <Key className="w-3.5 h-3.5 text-[#A8A49A]/30" />
              <span className="text-xs text-white">Change Password</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPasswordDialog(true)}
              className="text-[10px] h-7 border-white/[0.08] text-[#A8A49A]/60 hover:text-white bg-transparent"
            >
              Update
            </Button>
          </div>
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-[#A8A49A]/30" />
              <span className="text-xs text-white">Two-Factor Authentication</span>
            </div>
            <span className="text-[10px] text-[#A8A49A]/30">Coming soon</span>
          </div>
        </div>
      </div>

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-white">Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {passwordError && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-xs text-red-400">{passwordError}</p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs text-[#A8A49A]/60">New Password</Label>
              <Input
                type="password"
                value={passwordData.password}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, password: e.target.value })
                }
                className="bg-[#0A0A0A] border-white/[0.06] text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#A8A49A]/60">Confirm Password</Label>
              <Input
                type="password"
                value={passwordData.confirm}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirm: e.target.value })
                }
                className="bg-[#0A0A0A] border-white/[0.06] text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowPasswordDialog(false)}
                className="text-[#A8A49A]/60"
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={passwordSaving}
                className="bg-[#C9A84C] hover:bg-[#b8963f] text-black"
              >
                {passwordSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
