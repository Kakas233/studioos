"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DollarSign, Radio, Trash2, Plus, Users, Loader2, Eye, Zap, AlertTriangle, Info, Monitor, Lock,
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

// Map CamAccount platform names to SUPPORTED_SITES keys
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
  const { data: allCamAccounts = [] } = useCamAccounts();
  const { data: allAssignments = [] } = useAssignments();

  const supabase = createClient();
  const currentRole = account?.role;

  // All active cam accounts in the studio on supported alert sites
  const activeAccountIds = useMemo(() => new Set(allAccounts.filter((a) => a.is_active !== false).map((a) => a.id)), [allAccounts]);

  const supportedCamAccounts = useMemo(() => {
    return allCamAccounts
      .filter((ca) => ca.is_active !== false && ca.studio_id === studioId)
      .filter((ca) => platformToSiteKey[ca.platform])
      .filter((ca) => activeAccountIds.has(ca.model_id));
  }, [allCamAccounts, studioId, activeAccountIds]);

  // Role-based filtering
  const allowedModelIds = useMemo(() => {
    if (currentRole === "owner" || currentRole === "admin") {
      return null; // null means no filter
    }
    if (currentRole === "model") {
      return new Set([accountId]);
    }
    if (currentRole === "operator") {
      const assignedModelIds = allAssignments
        .filter((a) => a.operator_id === accountId)
        .map((a) => a.model_id);
      return new Set(assignedModelIds);
    }
    return new Set<string>();
  }, [currentRole, accountId, allAssignments]);

  const visibleCamAccounts = useMemo(() => {
    if (allowedModelIds === null) return supportedCamAccounts;
    return supportedCamAccounts.filter((ca) => allowedModelIds.has(ca.model_id));
  }, [supportedCamAccounts, allowedModelIds]);

  // Load all studio-wide alerts
  const loadAlerts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("member_alerts")
      .select("*")
      .eq("studio_id", studioId!)
      .eq("alert_type", "room_member");
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
    if (pendingBetaCamAccountId) {
      setSelectedCamAccountId(pendingBetaCamAccountId);
    }
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
    await supabase.from("member_alerts").insert({
      account_id: accountId,
      studio_id: studioId,
      alert_type: "room_member",
      cam_account_id: ca.id,
      model_username: ca.username.toLowerCase(),
      model_name: getModelName(ca),
      sites: [siteKey],
      spending_threshold: spendingThreshold,
      is_active: true,
    });
    setSelectedCamAccountId("");
    setSpendingThreshold(400);
    toast.success("Room tracking added");
    await loadAlerts();
    setAdding(false);
  };

  const handleRemoveRoom = async (alertId: string) => {
    await supabase.from("member_alerts").delete().eq("id", alertId);
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    toast.success("Room tracking removed");
  };

  const totalSlots = supportedCamAccounts.length;
  const usedSlots = claimedCamAccountIds.size;

  return (
    <div className="space-y-5">
      {/* How it works */}
      <Card className="bg-gradient-to-br from-[#111111] to-[#0D0D0D] border-white/[0.06] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#C9A84C]/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-[#C9A84C]" />
            </div>
            How Room Alerts Work
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-[#A8A49A]/60 leading-relaxed">
            When a member enters one of your monitored rooms, we automatically check their all-time spending history. If their spending is above your configured threshold, you&apos;ll instantly receive a detailed Telegram notification with their full spending breakdown — all-time, last 3 months, and last month.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3.5 text-center">
              <div className="text-lg mb-1">&#x1F464;</div>
              <p className="text-xs text-white font-medium">Member Enters Room</p>
              <p className="text-[10px] text-[#A8A49A]/40 mt-1">Detected automatically</p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3.5 text-center">
              <div className="text-lg mb-1">&#x1F4B0;</div>
              <p className="text-xs text-white font-medium">Spending Checked</p>
              <p className="text-[10px] text-[#A8A49A]/40 mt-1">All-time, 3mo, 1mo</p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3.5 text-center">
              <div className="text-lg mb-1">&#x1F514;</div>
              <p className="text-xs text-white font-medium">Telegram Alert</p>
              <p className="text-[10px] text-[#A8A49A]/40 mt-1">Instant notification</p>
            </div>
          </div>

          <div className="bg-amber-500/[0.06] border border-amber-500/15 rounded-xl px-4 py-3 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-amber-400 font-medium mb-0.5">Public tips only</p>
              <p className="text-[11px] text-amber-400/60 leading-relaxed">
                Spending data reflects public tips made in the chat room. Tips from private shows, group shows, and anonymous/secret tips are not included in spending calculations.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capacity indicator */}
      <Card className="bg-[#111111] border-white/[0.06]">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center">
                <Monitor className="w-4 h-4 text-[#C9A84C]" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Monitoring Capacity</p>
                <p className="text-[11px] text-[#A8A49A]/40 mt-0.5">Based on your studio&apos;s linked cam accounts</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-lg font-semibold text-white">{usedSlots}<span className="text-[#A8A49A]/30 font-normal"> / {totalSlots}</span></p>
                <p className="text-[10px] text-[#A8A49A]/30">slots used</p>
              </div>
              <div className="w-24 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${usedSlots >= totalSlots ? "bg-red-500" : usedSlots > totalSlots * 0.7 ? "bg-amber-500" : "bg-[#C9A84C]"}`}
                  style={{ width: `${totalSlots > 0 ? Math.min(100, (usedSlots / totalSlots) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
          {totalSlots === 0 && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-amber-500/[0.05] border border-amber-500/10 rounded-lg">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-400/70 leading-relaxed">
                No cam accounts linked to supported alert sites yet. Link cam accounts to your models in <strong className="text-amber-400">User Management → Edit Model → Cam Accounts</strong> to unlock monitoring slots.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Room Tracking */}
      <Card className="bg-[#111111] border-white/[0.06]">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Plus className="w-4 h-4 text-emerald-400" />
            </div>
            Add Room to Monitor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {availableCamAccounts.length === 0 && totalSlots > 0 ? (
            <div className="flex items-center gap-3 p-4 bg-white/[0.02] rounded-xl border border-white/[0.04]">
              <Lock className="w-5 h-5 text-[#A8A49A]/30 shrink-0" />
              <div>
                <p className="text-sm text-white font-medium">All slots in use</p>
                <p className="text-xs text-[#A8A49A]/40 mt-0.5">
                  {visibleCamAccounts.length === 0
                    ? "No cam accounts available for you to monitor. Only models assigned to you can be tracked."
                    : "All linked cam accounts are already being monitored. Remove an existing monitor or link more cam accounts to your models."}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <Label className="text-xs text-[#A8A49A]/60 mb-2 block font-medium">Select Model Account</Label>
                <Select value={selectedCamAccountId} onValueChange={(v) => v !== null && handleSelectCamAccount(v)}>
                  <SelectTrigger className="h-10 bg-white/[0.03] border-white/[0.06] text-white rounded-xl text-sm hover:border-[#C9A84C]/20 transition-colors">
                    <SelectValue placeholder="Choose a model's cam account..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-white/[0.08] rounded-xl shadow-2xl shadow-black/50 backdrop-blur-xl">
                    {availableCamAccounts.map((ca) => {
                      const modelName = getModelName(ca);
                      const siteKey = platformToSiteKey[ca.platform];
                      const siteInfo = SUPPORTED_SITES.find((s) => s.key === siteKey);
                      const isBeta = BETA_SITES.includes(siteKey);
                      return (
                        <SelectItem key={ca.id} value={ca.id} className="text-[#A8A49A] focus:bg-white/[0.05] focus:text-white rounded-lg mx-1 cursor-pointer">
                          <span className="flex items-center gap-2">
                            <span className="font-medium text-white/90">{modelName}</span>
                            <span className="text-white/10">·</span>
                            <span className={siteInfo?.color || "text-white/70"}>{ca.platform}</span>
                            <span className="text-[#A8A49A]/40">({ca.username})</span>
                            {isBeta && (
                              <span className="text-[8px] font-bold text-amber-400 uppercase tracking-wider bg-amber-400/10 px-1.5 py-0.5 rounded">BETA</span>
                            )}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {selectedCamAccount && (
                <>
                  <div>
                    <Label className="text-xs text-[#A8A49A]/60 mb-2 block font-medium">
                      Spending Threshold (USD)
                    </Label>
                    <p className="text-[11px] text-[#A8A49A]/35 mb-2">Only alert when a member&apos;s all-time public spending exceeds this amount</p>
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C9A84C]" />
                        <Input
                          type="number"
                          min={0}
                          step={50}
                          value={spendingThreshold}
                          onChange={(e) => setSpendingThreshold(parseInt(e.target.value) || 0)}
                          className="w-36 h-10 pl-9 bg-white/[0.03] border-white/[0.06] text-white rounded-xl text-sm focus:border-[#C9A84C]/30"
                        />
                      </div>
                      <span className="text-[11px] text-[#A8A49A]/30">Set to $0 to get alerts for every member</span>
                    </div>
                  </div>
                </>
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
        </CardContent>
      </Card>

      {/* Active Monitors */}
      <Card className="bg-[#111111] border-white/[0.06]">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-base flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center">
              <Eye className="w-4 h-4 text-[#C9A84C]" />
            </div>
            Your Active Monitors
            {myAlerts.length > 0 && (
              <Badge className="bg-white/[0.06] text-[#A8A49A]/60 text-[10px] border-0 ml-1">
                {myAlerts.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-[#C9A84C]" />
            </div>
          ) : myAlerts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-[#A8A49A]/20" />
              </div>
              <p className="text-sm text-[#A8A49A]/30 font-medium">No rooms monitored yet</p>
              <p className="text-xs text-[#A8A49A]/20 mt-1">Select a model account above to start receiving alerts</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myAlerts.map((alert: any) => {
                return (
                  <div key={alert.id} className="flex items-center gap-3 p-3.5 bg-white/[0.02] rounded-xl border border-white/[0.04] hover:border-white/[0.06] transition-colors group">
                    <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/15">
                      <Radio className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-white font-medium">{alert.model_name || alert.model_username}</p>
                        <span className="text-[10px] text-[#A8A49A]/30">({alert.model_username})</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {alert.sites?.map((s: string) => {
                          const site = SUPPORTED_SITES.find((x) => x.key === s);
                          return (
                            <Badge key={s} className={`${site?.bg || "bg-white/[0.04]"} ${site?.color || "text-[#A8A49A]/50"} text-[9px] border-0 font-medium`}>
                              {site?.label || s}
                            </Badge>
                          );
                        })}
                        <span className="text-[10px] text-[#C9A84C]/50 font-medium ml-1">
                          {alert.spending_threshold === 0 ? "• All members" : `• \u2265 $${alert.spending_threshold ?? 400}`}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-400/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveRoom(alert.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Beta site dialog */}
      <Dialog open={betaDialogOpen} onOpenChange={(open) => { if (!open) { setBetaDialogOpen(false); setPendingBetaCamAccountId(null); } }}>
        <DialogContent className="sm:max-w-[440px] bg-[#111111] border-white/[0.06]">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Info className="w-5 h-5 text-amber-400" />
              Beta Site — Limited Coverage
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {(() => {
              const pendingCa = supportedCamAccounts.find((ca) => ca.id === pendingBetaCamAccountId);
              const siteKey = pendingCa ? platformToSiteKey[pendingCa.platform] : null;
              const siteLabel = SUPPORTED_SITES.find((s) => s.key === siteKey)?.label || pendingCa?.platform;
              return (
                <>
                  <p className="text-sm text-[#A8A49A]/70 leading-relaxed">
                    Alerts for <strong className="text-white">{siteLabel}</strong> are currently in beta testing. Approximately <strong className="text-white">20%</strong> of the users entering the chatroom on this site get analyzed and, if they meet your spending threshold, sent as an alert on Telegram.
                  </p>
                  <p className="text-sm text-[#A8A49A]/70 leading-relaxed">
                    If you want to analyze any specific user in your room, you can manually look them up in <strong className="text-[#C9A84C]">Member Lookup</strong>.
                  </p>
                </>
              );
            })()}
          </div>
          <DialogFooter>
            <Button
              onClick={confirmBetaSelection}
              className="bg-[#C9A84C] hover:bg-[#B8973B] text-black font-medium"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
