"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DollarSign, Radio, Trash2, Plus, Loader2, Lock, Info, AlertTriangle,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";
import { useStudioAccounts, useCamAccounts, useAssignments } from "@/hooks/use-studio-data";

const SUPPORTED_SITES = [
  { key: "chaturbate", label: "Chaturbate", color: "text-[#F47421]", bg: "bg-[#F47421]/10" },
  { key: "stripchat", label: "Stripchat", color: "text-[#A2242D]", bg: "bg-[#A2242D]/10" },
  { key: "myfreecams", label: "MyFreeCams", color: "text-[#006E00]", bg: "bg-[#006E00]/10" },
  { key: "camsoda", label: "Camsoda", color: "text-[#01B0FA]", bg: "bg-[#01B0FA]/10" },
  { key: "bongacams", label: "Bongacams", color: "text-[#A02239]", bg: "bg-[#A02239]/10" },
  { key: "livejasmin", label: "LiveJasmin", color: "text-[#BA0000]", bg: "bg-[#BA0000]/10" },
];

const BETA_SITES = ["chaturbate", "bongacams", "livejasmin"];

const platformToSiteKey: Record<string, string> = {
  Chaturbate: "chaturbate",
  StripChat: "stripchat",
  MyFreeCams: "myfreecams",
  CamSoda: "camsoda",
  BongaCams: "bongacams",
  LiveJasmin: "livejasmin",
};

interface RoomMemberAlertsProps {
  accountId: string | undefined;
  studioId: string | undefined;
}

export default function RoomMemberAlerts({ accountId, studioId }: RoomMemberAlertsProps) {
  const [selectedCamAccountId, setSelectedCamAccountId] = useState("");
  const [spendingThreshold, setSpendingThreshold] = useState(400);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [betaDialogOpen, setBetaDialogOpen] = useState(false);
  const [pendingBetaCamAccountId, setPendingBetaCamAccountId] = useState<string | null>(null);

  const { account } = useAuth();
  const { data: allAccounts = [] } = useStudioAccounts();
  const { data: allCamAccounts = [], refetch: refetchCamAccounts } = useCamAccounts();
  const { data: allAssignments = [] } = useAssignments();

  // Always refetch cam accounts on mount so changes from User Management are reflected
  useEffect(() => {
    refetchCamAccounts();
  }, [refetchCamAccounts]);

  const supabase = createClient();
  const currentRole = account?.role;

  const activeAccountIds = useMemo(() => new Set(allAccounts.filter((a) => a.is_active !== false).map((a) => a.id)), [allAccounts]);

  const supportedCamAccounts = useMemo(() => {
    return allCamAccounts
      .filter((ca) => ca.is_active !== false && ca.studio_id === studioId)
      .filter((ca) => platformToSiteKey[ca.platform])
      .filter((ca) => activeAccountIds.has(ca.model_id));
  }, [allCamAccounts, studioId, activeAccountIds]);

  const allowedModelIds = useMemo(() => {
    if (currentRole === "owner" || currentRole === "admin") return null;
    if (currentRole === "model") return new Set([accountId]);
    if (currentRole === "operator") {
      const assignedModelIds = allAssignments.filter((a) => a.operator_id === accountId).map((a) => a.model_id);
      return new Set(assignedModelIds);
    }
    return new Set<string>();
  }, [currentRole, accountId, allAssignments]);

  const visibleCamAccounts = useMemo(() => {
    if (allowedModelIds === null) return supportedCamAccounts;
    return supportedCamAccounts.filter((ca) => allowedModelIds.has(ca.model_id));
  }, [supportedCamAccounts, allowedModelIds]);

  const loadAlerts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("member_alerts")
      .select("*")
      .eq("studio_id", studioId!);
    setAlerts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (studioId) loadAlerts();
  }, [studioId]);

  const myAlerts = useMemo(() => alerts.filter((a) => a.account_id === accountId), [alerts, accountId]);

  const claimedCamAccountIds = useMemo(() => {
    return new Set(alerts.filter((a) => a.cam_account_id).map((a) => a.cam_account_id));
  }, [alerts]);

  const availableCamAccounts = useMemo(() => {
    return visibleCamAccounts.filter((ca) => !claimedCamAccountIds.has(ca.id));
  }, [visibleCamAccounts, claimedCamAccountIds]);

  const getModelName = (camAccount: any) => {
    const model = allAccounts.find((a) => a.id === camAccount.model_id);
    return model?.first_name || "Unknown";
  };

  const selectedCamAccount = supportedCamAccounts.find((ca) => ca.id === selectedCamAccountId);

  const handleSelectCamAccount = (camAccountId: string) => {
    const ca = supportedCamAccounts.find((c) => c.id === camAccountId);
    if (!ca) return;
    const siteKey = platformToSiteKey[ca.platform];
    if (BETA_SITES.includes(siteKey)) {
      setPendingBetaCamAccountId(camAccountId);
      setBetaDialogOpen(true);
    } else {
      setSelectedCamAccountId(camAccountId);
    }
  };

  const confirmBetaSelection = () => {
    if (pendingBetaCamAccountId) setSelectedCamAccountId(pendingBetaCamAccountId);
    setBetaDialogOpen(false);
    setPendingBetaCamAccountId(null);
  };

  const handleAddRoom = async () => {
    if (!selectedCamAccountId) return;
    const ca = supportedCamAccounts.find((c) => c.id === selectedCamAccountId);
    if (!ca) return;
    const siteKey = platformToSiteKey[ca.platform];
    if (!siteKey) return;

    setAdding(true);
    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cam_account_id: ca.id,
          model_username: ca.username.toLowerCase(),
          model_name: getModelName(ca),
          sites: [siteKey],
          spending_threshold: spendingThreshold,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to add room tracking");
        return;
      }
      setSelectedCamAccountId("");
      setSpendingThreshold(400);
      toast.success("Room tracking added");
      await loadAlerts();
    } catch {
      toast.error("Failed to add room tracking");
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveRoom = async (alertId: string) => {
    try {
      const res = await fetch(`/api/alerts?id=${alertId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to remove tracking");
        return;
      }
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      toast.success("Room tracking removed");
    } catch {
      toast.error("Failed to remove tracking");
    }
  };

  const totalSlots = supportedCamAccounts.length;
  const usedSlots = claimedCamAccountIds.size;

  return (
    <div className="space-y-5">
      {/* How it works — collapsed to a simple note */}
      <div className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-4">
        <p className="text-sm text-white font-medium mb-1">How it works</p>
        <p className="text-xs text-[#A8A49A]/50 leading-relaxed">
          When a member enters a monitored room, their all-time spending is checked. If it exceeds your threshold, you get an instant Telegram alert with their full spending breakdown.
        </p>
        <p className="text-[11px] text-[#A8A49A]/30 mt-2">
          Only public tips are tracked. Private/anonymous tips are not included.
        </p>
      </div>

      {/* Beta sites notice */}
      <div className="flex gap-3 p-3.5 rounded-xl border border-[#C9A84C]/15 bg-[#C9A84C]/[0.04]">
        <div className="shrink-0 mt-0.5">
          <div className="w-5 h-5 rounded-full bg-[#C9A84C]/10 flex items-center justify-center">
            <AlertTriangle className="w-3 h-3 text-[#C9A84C]/70" />
          </div>
        </div>
        <div>
          <p className="text-xs text-[#C9A84C]/80 font-medium leading-snug">
            Chaturbate, LiveJasmin & Bongacams are in beta
          </p>
          <p className="text-[11px] text-[#A8A49A]/40 mt-1 leading-relaxed">
            Approximately 20% of joining members are scanned on these sites. StripChat, MyFreeCams & Camsoda have full coverage.
          </p>
        </div>
      </div>

      {/* Capacity */}
      <div className="flex items-center justify-between border border-white/[0.06] rounded-xl bg-white/[0.02] p-4">
        <div>
          <p className="text-sm font-medium text-white">Monitoring Capacity</p>
          <p className="text-[11px] text-[#A8A49A]/40 mt-0.5">Based on linked cam accounts</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-lg font-semibold text-white">{usedSlots}<span className="text-[#A8A49A]/30 font-normal"> / {totalSlots}</span></p>
          <div className="w-20 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${usedSlots >= totalSlots ? "bg-red-500" : "bg-[#C9A84C]"}`}
              style={{ width: `${totalSlots > 0 ? Math.min(100, (usedSlots / totalSlots) * 100) : 0}%` }}
            />
          </div>
        </div>
      </div>

      {totalSlots === 0 && (
        <p className="text-xs text-[#A8A49A]/40 px-1">
          No cam accounts linked to supported sites yet. Link accounts in User Management to unlock monitoring.
        </p>
      )}

      {/* Add Room Tracking */}
      <div className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-4 space-y-4">
        <p className="text-sm font-medium text-white">Add Room to Monitor</p>

        {availableCamAccounts.length === 0 && totalSlots > 0 ? (
          <p className="text-xs text-[#A8A49A]/40">
            {visibleCamAccounts.length === 0
              ? "No cam accounts available for you to monitor."
              : "All linked cam accounts are already being monitored."}
          </p>
        ) : (
          <>
            <div>
              <Label className="text-xs text-[#A8A49A]/60 mb-2 block">Model Account</Label>
              <Select value={selectedCamAccountId} onValueChange={(v) => v !== null && handleSelectCamAccount(v)}>
                <SelectTrigger className="w-full h-10 bg-white/[0.03] border-white/[0.06] text-white rounded-xl text-sm">
                  <span className="truncate">{selectedCamAccountId ? (() => { const ca = availableCamAccounts.find((c) => c.id === selectedCamAccountId); return ca ? `${getModelName(ca)} · ${ca.platform} (${ca.username})` : "Choose..."; })() : "Choose a model's cam account..."}</span>
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-white/[0.08] rounded-xl">
                  {availableCamAccounts.map((ca) => {
                    const modelName = getModelName(ca);
                    const siteKey = platformToSiteKey[ca.platform];
                    const isBeta = BETA_SITES.includes(siteKey);
                    return (
                      <SelectItem key={ca.id} value={ca.id} className="text-[#A8A49A] focus:bg-white/[0.05] focus:text-white rounded-lg mx-1 cursor-pointer">
                        {modelName} · {ca.platform} ({ca.username}){isBeta ? " [BETA]" : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedCamAccount && (
              <div>
                <Label className="text-xs text-[#A8A49A]/60 mb-2 block">
                  Spending Threshold (USD)
                </Label>
                <p className="text-[11px] text-[#A8A49A]/35 mb-2">Only alert when spending exceeds this amount</p>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A49A]/40" />
                    <Input
                      type="number"
                      min={0}
                      step={50}
                      value={spendingThreshold}
                      onChange={(e) => setSpendingThreshold(parseInt(e.target.value) || 0)}
                      className="w-36 h-10 pl-9 bg-white/[0.03] border-white/[0.06] text-white rounded-xl text-sm"
                    />
                  </div>
                  <span className="text-[11px] text-[#A8A49A]/30">$0 = alert for every member</span>
                </div>
              </div>
            )}

            <Button
              onClick={handleAddRoom}
              disabled={!selectedCamAccountId || adding}
              className="bg-[#C9A84C] hover:bg-[#B8973B] text-black text-sm font-medium rounded-xl h-10 px-5"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Add Room Tracking
            </Button>
          </>
        )}
      </div>

      {/* Active Monitors */}
      <div className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-4">
        <div className="flex items-center gap-2 mb-4">
          <p className="text-sm font-medium text-white">Your Active Monitors</p>
          {myAlerts.length > 0 && (
            <span className="text-[10px] text-[#A8A49A]/40">{myAlerts.length}</span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-[#C9A84C]" />
          </div>
        ) : myAlerts.length === 0 ? (
          <p className="text-xs text-[#A8A49A]/30 py-8 text-center">
            No rooms monitored yet
          </p>
        ) : (
          <div className="space-y-2">
            {myAlerts.map((alert: any) => (
              <div key={alert.id} className="flex items-center gap-3 p-3 bg-white/[0.02] rounded-lg border border-white/[0.04] hover:border-white/[0.06] transition-colors group">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white font-medium">{alert.model_name || alert.model_username}</p>
                    <span className="text-[10px] text-[#A8A49A]/30">({alert.model_username})</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {alert.sites?.map((s: string) => {
                      const site = SUPPORTED_SITES.find((x) => x.key === s);
                      return (
                        <span key={s} className={`text-[10px] ${site?.color || "text-[#A8A49A]/50"}`}>
                          {site?.label || s}
                        </span>
                      );
                    })}
                    <span className="text-[10px] text-[#A8A49A]/30">
                      {alert.spending_threshold === 0 ? "· All members" : `· \u2265 $${alert.spending_threshold ?? 400}`}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-[#A8A49A]/20 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleRemoveRoom(alert.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Beta site dialog */}
      <Dialog open={betaDialogOpen} onOpenChange={(open) => { if (!open) { setBetaDialogOpen(false); setPendingBetaCamAccountId(null); } }}>
        <DialogContent className="sm:max-w-[440px] bg-[#111111] border-white/[0.06]">
          <DialogHeader>
            <DialogTitle className="text-white">Beta Site — Limited Coverage</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {(() => {
              const pendingCa = supportedCamAccounts.find((ca) => ca.id === pendingBetaCamAccountId);
              const siteKey = pendingCa ? platformToSiteKey[pendingCa.platform] : null;
              const siteLabel = SUPPORTED_SITES.find((s) => s.key === siteKey)?.label || pendingCa?.platform;
              return (
                <>
                  <p className="text-sm text-[#A8A49A]/70 leading-relaxed">
                    Alerts for <strong className="text-white">{siteLabel}</strong> are in beta. About <strong className="text-white">20%</strong> of room visitors get analyzed. If they meet your threshold, you receive a Telegram alert.
                  </p>
                  <p className="text-sm text-[#A8A49A]/70 leading-relaxed">
                    You can manually look up any user in <strong className="text-white">Member Lookup</strong>.
                  </p>
                </>
              );
            })()}
          </div>
          <DialogFooter>
            <Button onClick={confirmBetaSelection} className="bg-[#C9A84C] hover:bg-[#B8973B] text-black font-medium">
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
