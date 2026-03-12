"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Shield,
  LogOut,
  Building2,
  Users,
  DollarSign,
  Activity,
  Trash2,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  CreditCard,
  Monitor,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Bell,
  Send,
  FileText,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import SuperAdminStudioDetail from "@/components/superadmin/studio-detail";
import SubscriptionManager from "@/components/superadmin/subscription-manager";
import ActivityFeed from "@/components/superadmin/activity-feed";
import VPSMonitor from "@/components/superadmin/vps-monitor";
import TelegramTab from "@/components/superadmin/telegram-tab";
import DailyLogTab from "@/components/superadmin/daily-log-tab";

interface DashStats {
  total_studios?: number;
  active_studios?: number;
  trialing_studios?: number;
  suspended_studios?: number;
  grace_period_studios?: number;
  total_accounts?: number;
  total_models?: number;
  total_operators?: number;
  total_revenue_usd?: number;
  total_earnings_records?: number;
  total_active_alerts?: number;
  room_member_alerts?: number;
  online_tracking_alerts?: number;
  tiers?: {
    elite?: number;
    pro?: number;
    starter?: number;
    free?: number;
  };
}

interface StudioRow {
  id: string;
  name: string;
  subdomain: string;
  subscription_tier: string;
  subscription_status: string;
  model_limit: number;
  current_model_count: number;
  created_date: string;
  active_alerts?: number;
  last_payment_date?: string;
  next_payment_date?: string;
  grace_period_ends_at?: string;
  [key: string]: unknown;
}

interface DashData {
  stats: DashStats;
  studios: StudioRow[];
}

export default function SuperAdminPanel() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [dashData, setDashData] = useState<DashData | null>(null);
  const [error, setError] = useState("");
  const [selectedStudio, setSelectedStudio] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showGenerateForm, setShowGenerateForm] = useState(false);
  const [genForm, setGenForm] = useState({ studio_name: "", owner_email: "", owner_password: "", owner_first_name: "", model_limit: 30 });
  const [generating, setGenerating] = useState(false);

  const [sessionValid, setSessionValid] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((r) => r.json())
      .then((d) => {
        if (!d.authenticated) {
          router.push("/super-admin/login");
        } else {
          setSessionValid(true);
          fetchDashboard();
        }
      })
      .catch(() => router.push("/super-admin/login"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getDashboard",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDashData(data.data);
      } else {
        if (
          data.error === "Session expired" ||
          data.error === "Invalid session"
        ) {
          router.push("/super-admin/login");
        }
        setError(data.error);
      }
    } catch {
      setError("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.push("/super-admin/login");
  };

  const handleDeleteStudio = async (studioId: string, studioName: string) => {
    if (
      !confirm(
        `Are you sure you want to DELETE "${studioName}"? This will deactivate all accounts and remove the studio permanently.`
      )
    )
      return;
    try {
      const res = await fetch("/api/admin/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteStudio",
          payload: { studio_id: studioId },
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchDashboard();
        setSelectedStudio(null);
      }
    } catch {
      alert("Failed to delete studio");
    }
  };

  const handleGenerateStudio = async () => {
    if (!genForm.studio_name || !genForm.owner_email || !genForm.owner_password || !genForm.owner_first_name) {
      alert("All fields are required");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/admin/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generateFreeStudio", payload: genForm }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Studio "${genForm.studio_name}" created!\n\nEmail: ${genForm.owner_email}\nPassword: ${genForm.owner_password}\nPlan: Elite (${genForm.model_limit} models)\n\nShare these credentials with the studio owner.`);
        setShowGenerateForm(false);
        setGenForm({ studio_name: "", owner_email: "", owner_password: "", owner_first_name: "", model_limit: 30 });
        fetchDashboard();
      } else {
        alert(data.error || "Failed to create studio");
      }
    } catch {
      alert("Failed to create studio");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#AA0608] animate-spin" />
      </div>
    );
  }

  if (selectedStudio) {
    return (
      <SuperAdminStudioDetail
        studioId={selectedStudio}
        onBack={() => setSelectedStudio(null)}
        onDelete={handleDeleteStudio}
      />
    );
  }

  const stats = dashData?.stats || ({} as DashStats);
  const studios = dashData?.studios || [];
  const filteredStudios = studios.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.subdomain?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#AA0608] rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">StudioOS Super Admin</h1>
              <p className="text-xs text-gray-500">
                God Mode &bull; Full Platform Access
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchDashboard}
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className="w-4 h-4 mr-1" /> Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300"
            >
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatCard
            icon={Building2}
            label="Total Studios"
            value={stats.total_studios || 0}
            sub={`${stats.active_studios || 0} active`}
          />
          <StatCard
            icon={CheckCircle2}
            label="Paying"
            value={
              (stats.tiers?.elite || 0) +
              (stats.tiers?.pro || 0) +
              (stats.tiers?.starter || 0)
            }
            sub={`E:${stats.tiers?.elite || 0} P:${stats.tiers?.pro || 0} S:${stats.tiers?.starter || 0}`}
          />
          <StatCard
            icon={Clock}
            label="Trialing"
            value={stats.trialing_studios || 0}
            sub={`${stats.suspended_studios || 0} suspended`}
          />
          <StatCard
            icon={Users}
            label="Users"
            value={stats.total_accounts || 0}
            sub={`${stats.total_models || 0}M ${stats.total_operators || 0}O`}
          />
          <StatCard
            icon={DollarSign}
            label="Revenue"
            value={`$${(stats.total_revenue_usd || 0).toLocaleString("en-US", { minimumFractionDigits: 0 })}`}
            sub={`${stats.total_earnings_records || 0} records`}
          />
          <StatCard
            icon={Bell}
            label="Alerts Tracked"
            value={stats.total_active_alerts || 0}
            sub={`${stats.room_member_alerts || 0} room \u2022 ${stats.online_tracking_alerts || 0} online`}
          />
          <StatCard
            icon={AlertTriangle}
            label="Issues"
            value={
              (stats.grace_period_studios || 0) +
              (stats.suspended_studios || 0)
            }
            sub={`${stats.grace_period_studios || 0} grace`}
            accent
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => v !== null && setActiveTab(v)}>
          <TabsList className="bg-white/5 border border-white/10">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400"
            >
              <Building2 className="w-4 h-4 mr-1.5" /> Studios
            </TabsTrigger>
            <TabsTrigger
              value="subscriptions"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400"
            >
              <CreditCard className="w-4 h-4 mr-1.5" /> Subscriptions
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400"
            >
              <Activity className="w-4 h-4 mr-1.5" /> Activity
            </TabsTrigger>
            <TabsTrigger
              value="monitor"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400"
            >
              <Monitor className="w-4 h-4 mr-1.5" /> VPS Monitor
            </TabsTrigger>
            <TabsTrigger
              value="telegram"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400"
            >
              <Send className="w-4 h-4 mr-1.5" /> Telegram
            </TabsTrigger>
            <TabsTrigger
              value="dailylog"
              className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-gray-400"
            >
              <FileText className="w-4 h-4 mr-1.5" /> Daily Log
            </TabsTrigger>
          </TabsList>

          {/* Studios Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">All Studios</h2>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => setShowGenerateForm(!showGenerateForm)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                  Generate Free Studio
                </Button>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search studios..."
                    className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-gray-600"
                  />
                </div>
              </div>
            </div>

            {/* Generate Free Studio Form */}
            {showGenerateForm && (
              <Card className="bg-[#0A0A0A] border-emerald-500/20">
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm font-semibold text-emerald-400">Generate Free Elite Studio</p>
                  <p className="text-xs text-gray-500">Creates a permanent Elite plan studio with no Stripe subscription. For testing partners only.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider">Studio Name *</label>
                      <Input value={genForm.studio_name} onChange={(e) => setGenForm({ ...genForm, studio_name: e.target.value })} placeholder="Test Studio" className="bg-white/5 border-white/10 text-white h-8 text-sm mt-1" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider">Owner Name *</label>
                      <Input value={genForm.owner_first_name} onChange={(e) => setGenForm({ ...genForm, owner_first_name: e.target.value })} placeholder="John" className="bg-white/5 border-white/10 text-white h-8 text-sm mt-1" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider">Owner Email *</label>
                      <Input type="email" value={genForm.owner_email} onChange={(e) => setGenForm({ ...genForm, owner_email: e.target.value })} placeholder="owner@studio.com" className="bg-white/5 border-white/10 text-white h-8 text-sm mt-1" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider">Password *</label>
                      <Input value={genForm.owner_password} onChange={(e) => setGenForm({ ...genForm, owner_password: e.target.value })} placeholder="Min 8 characters" className="bg-white/5 border-white/10 text-white h-8 text-sm mt-1" />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-wider">Model Limit</label>
                      <Input type="number" value={genForm.model_limit} onChange={(e) => setGenForm({ ...genForm, model_limit: Number(e.target.value) || 30 })} className="bg-white/5 border-white/10 text-white h-8 text-sm mt-1" />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <Button size="sm" variant="ghost" onClick={() => setShowGenerateForm(false)} className="text-gray-400 text-xs">Cancel</Button>
                    <Button size="sm" onClick={handleGenerateStudio} disabled={generating} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                      {generating ? <><Loader2 className="w-3 h-3 animate-spin mr-1" />Creating...</> : "Create Studio"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              {filteredStudios.length === 0 && (
                <p className="text-gray-500 text-center py-8">
                  No studios found.
                </p>
              )}
              {filteredStudios.map((studio) => {
                const statusConf: Record<string, string> = {
                  active:
                    "bg-green-500/10 text-green-400 border-green-500/20",
                  trialing:
                    "bg-blue-500/10 text-blue-400 border-blue-500/20",
                  grace_period:
                    "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
                  suspended:
                    "bg-red-500/10 text-red-400 border-red-500/20",
                  cancelled:
                    "bg-gray-500/10 text-gray-400 border-gray-500/20",
                };
                const statusClass =
                  statusConf[studio.subscription_status] ||
                  "bg-gray-500/10 text-gray-400 border-gray-500/20";

                return (
                  <Card
                    key={studio.id}
                    className="bg-[#0A0A0A] border-white/10 hover:border-white/20 transition-colors"
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#AA0608]/10 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-[#AA0608]" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">
                            {studio.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {studio.subdomain} &bull; Created{" "}
                            {new Date(
                              studio.created_date
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={statusClass}>
                          {studio.subscription_tier} &bull;{" "}
                          {studio.subscription_status}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {studio.current_model_count || 0}/
                          {studio.model_limit || 0} models
                        </span>
                        {(studio.active_alerts ?? 0) > 0 && (
                          <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                            <Bell className="w-3 h-3 mr-1" />
                            {studio.active_alerts} alerts
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedStudio(studio.id)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Eye className="w-4 h-4 mr-1" /> View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDeleteStudio(studio.id, studio.name)
                          }
                          className="text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions" className="mt-4">
            <SubscriptionManager studios={studios} />
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-4">
            <ActivityFeed
              allStudios={studios}
            />
          </TabsContent>

          {/* VPS Monitor Tab */}
          <TabsContent value="monitor" className="mt-4">
            <VPSMonitor />
          </TabsContent>

          {/* Telegram Tab */}
          <TabsContent value="telegram" className="mt-4">
            <TelegramTab />
          </TabsContent>

          {/* Daily Log Tab */}
          <TabsContent value="dailylog" className="mt-4">
            <DailyLogTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Card className="bg-[#0A0A0A] border-white/10">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <Icon
            className={`w-4 h-4 ${accent ? "text-yellow-400" : "text-[#AA0608]"}`}
          />
          <span className="text-[10px] text-gray-500 uppercase tracking-wide">
            {label}
          </span>
        </div>
        <p className="text-xl font-bold text-white">{value}</p>
        {sub && (
          <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>
        )}
      </CardContent>
    </Card>
  );
}
