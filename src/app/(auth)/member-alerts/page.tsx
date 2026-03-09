"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useCamAccounts, useStudioAccounts } from "@/hooks/use-studio-data";
import { useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Bell,
  BellOff,
  Shield,
  AlertTriangle,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PLATFORMS } from "@/lib/platforms";

interface MemberAlert {
  id: string;
  model_username: string;
  model_name: string;
  sites: string[];
  spending_threshold: number;
  is_active: boolean;
  created_at: string;
}

export default function MemberAlertsPage() {
  const { isAdmin } = useAuth();
  const { data: camAccounts = [], isLoading: camLoading } = useCamAccounts();
  const { data: accounts = [] } = useStudioAccounts();
  const queryClient = useQueryClient();

  const [alerts, setAlerts] = useState<MemberAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    model_username: "",
    model_name: "",
    sites: [] as string[],
    spending_threshold: 100,
  });

  // Fetch alerts
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch("/api/alerts");
        if (res.ok) {
          const data = await res.json();
          setAlerts(data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  const handleCreate = useCallback(async () => {
    if (!newAlert.model_username.trim()) return;
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAlert),
    });
    if (res.ok) {
      const data = await res.json();
      setAlerts((prev) => [data, ...prev]);
      setCreateOpen(false);
      setNewAlert({ model_username: "", model_name: "", sites: [], spending_threshold: 100 });
    }
  }, [newAlert]);

  const handleToggle = useCallback(async (id: string, is_active: boolean) => {
    await fetch("/api/alerts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active }),
    });
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, is_active } : a)));
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/alerts?id=${id}`, { method: "DELETE" });
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const activeAlerts = alerts.filter((a) => a.is_active);
  const inactiveAlerts = alerts.filter((a) => !a.is_active);

  if (loading || camLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#C9A84C]/10 flex items-center justify-center">
              <Bell className="w-5 h-5 text-[#C9A84C]" />
            </div>
            <div>
              <h2 className="text-sm font-medium text-white">Member Alerts</h2>
              <p className="text-xs text-[#A8A49A]/40">
                {alerts.length} alert{alerts.length !== 1 ? "s" : ""} configured
              </p>
            </div>
          </div>
          {isAdmin && (
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-[#C9A84C] hover:bg-[#b8963f] text-black font-medium"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Alert
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <p className="text-sm font-medium text-white">Active Alerts</p>
          </div>
          <p className="text-lg font-semibold text-white">{activeAlerts.length}</p>
        </div>
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <p className="text-sm font-medium text-white">Platforms Covered</p>
          </div>
          <p className="text-lg font-semibold text-white">
            {new Set(alerts.flatMap((a) => a.sites || [])).size}
          </p>
        </div>
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BellOff className="w-4 h-4 text-red-400" />
            <p className="text-sm font-medium text-white">Paused</p>
          </div>
          <p className="text-lg font-semibold text-white">{inactiveAlerts.length}</p>
        </div>
      </div>

      {/* Alerts List */}
      <div className="bg-[#111111] border border-white/[0.04] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.04]">
          <p className="text-sm font-medium text-white">Alert Rules</p>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {alerts.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Bell className="w-10 h-10 text-[#A8A49A]/20 mx-auto mb-3" />
              <p className="text-sm text-[#A8A49A]/40 mb-1">No alerts configured</p>
              <p className="text-xs text-[#A8A49A]/25">
                Create alerts to monitor specific members across your platforms.
              </p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-white">
                      {alert.model_name || alert.model_username}
                    </p>
                    <Badge
                      variant="outline"
                      className={`text-[9px] ${
                        alert.is_active
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-white/[0.04] text-[#A8A49A]/30 border-white/[0.06]"
                      }`}
                    >
                      {alert.is_active ? "Active" : "Paused"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {(alert.sites || []).map((site) => (
                      <span key={site} className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.04] text-[#A8A49A]/50">
                        {site}
                      </span>
                    ))}
                    {alert.spending_threshold > 0 && (
                      <span className="text-[9px] text-[#A8A49A]/30">
                        Threshold: ${alert.spending_threshold}
                      </span>
                    )}
                  </div>
                </div>
                <Switch
                  checked={alert.is_active}
                  onCheckedChange={(checked) => handleToggle(alert.id, checked)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(alert.id)}
                  className="text-[#A8A49A]/20 hover:text-red-400 h-7 w-7"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* VPS Monitor */}
      <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-6">
        <h3 className="text-sm font-medium text-white mb-2">Alert Monitor</h3>
        <p className="text-xs text-[#A8A49A]/40 mb-3">
          The alert monitoring system runs on an external server. When alerts are triggered,
          notifications are sent via Telegram.
        </p>
        {process.env.NEXT_PUBLIC_VPS_URL ? (
          <iframe
            src={`${process.env.NEXT_PUBLIC_VPS_URL}/admin`}
            className="w-full h-[400px] rounded-lg border border-white/[0.06]"
            title="Alert Monitor"
          />
        ) : (
          <div className="w-full h-[200px] rounded-lg border border-white/[0.06] flex items-center justify-center">
            <p className="text-xs text-[#A8A49A]/30">
              VPS monitor URL not configured
            </p>
          </div>
        )}
      </div>

      {/* Create Alert Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[#111111] border-white/[0.08] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Create Member Alert</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#A8A49A]/60">Member Username *</Label>
              <Input
                value={newAlert.model_username}
                onChange={(e) => setNewAlert({ ...newAlert, model_username: e.target.value })}
                className="bg-[#0A0A0A] border-white/[0.06] text-white"
                placeholder="username123"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#A8A49A]/60">Display Name</Label>
              <Input
                value={newAlert.model_name}
                onChange={(e) => setNewAlert({ ...newAlert, model_name: e.target.value })}
                className="bg-[#0A0A0A] border-white/[0.06] text-white"
                placeholder="Optional display name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#A8A49A]/60">Spending Threshold ($)</Label>
              <Input
                type="number"
                min={0}
                value={newAlert.spending_threshold}
                onChange={(e) => setNewAlert({ ...newAlert, spending_threshold: Number(e.target.value) })}
                className="bg-[#0A0A0A] border-white/[0.06] text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#A8A49A]/60">Monitor on Platforms</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PLATFORMS).map(([id, p]) => {
                  const selected = newAlert.sites.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        setNewAlert({
                          ...newAlert,
                          sites: selected
                            ? newAlert.sites.filter((s) => s !== id)
                            : [...newAlert.sites, id],
                        })
                      }
                      className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                        selected
                          ? "border-[#C9A84C]/30 bg-[#C9A84C]/10 text-[#C9A84C]"
                          : "border-white/[0.06] text-[#A8A49A]/40 hover:text-white"
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => setCreateOpen(false)}
                className="text-[#A8A49A]/60"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!newAlert.model_username.trim()}
                className="bg-[#C9A84C] hover:bg-[#b8963f] text-black"
              >
                Create Alert
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
