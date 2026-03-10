"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  RefreshCw,
  Building2,
  Users,
  Bell,
  DollarSign,
  UserPlus,
  CreditCard,
  AlertTriangle,
  Clock,
  type LucideIcon,
} from "lucide-react";

function StatRow({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-sm font-medium ${color}`}>{value}</span>
    </div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="bg-[#0A0A0A] border-white/10">
      <CardHeader className="pb-2">
        <CardTitle className="text-white text-sm flex items-center gap-2">
          <Icon className="w-4 h-4 text-[#AA0608]" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function FunnelCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Card className="bg-[#0A0A0A] border-white/10">
      <CardContent className="p-3 text-center">
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-0.5">
          {label}
        </p>
      </CardContent>
    </Card>
  );
}

interface DailyLogData {
  summary: {
    total_studios: number;
    trialing: number;
    active: number;
    paying: number;
    grace_period: number;
    suspended: number;
    cancelled: number;
    stripe_connected: number;
    stripe_subscribed: number;
  };
  tier_breakdown: {
    elite: number;
    pro: number;
    starter: number;
    free: number;
  };
  accounts: {
    total: number;
    active: number;
    inactive: number;
    roles: {
      owner: number;
      admin: number;
      operator: number;
      model: number;
      accountant: number;
    };
  };
  alerts: {
    total_active: number;
    by_studio: { studio_id: string; studio_name: string; count: number }[];
  };
  daily_registrations: {
    date: string;
    studios: { name: string; tier: string; status: string }[];
  }[];
  grace_studios: {
    name: string;
    tier: string;
    grace_ends?: string;
  }[];
  trialing_studios: {
    name: string;
    tier: string;
    created?: string;
    grace_ends?: string;
  }[];
  paying_studios: {
    name: string;
    tier: string;
    next_payment?: string;
  }[];
}

export default function DailyLogTab() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DailyLogData | null>(null);

  useEffect(() => {
    fetchLog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchLog = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({

          action: "getDailyLog",
        }),
      });
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch (e) {
      console.error("Failed to fetch daily log:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-[#AA0608] animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <p className="text-gray-500 text-center py-8">
        Failed to load daily log.
      </p>
    );
  }

  const {
    summary,
    tier_breakdown,
    accounts,
    alerts,
    daily_registrations,
    grace_studios,
    trialing_studios,
    paying_studios,
  } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Platform Daily Log</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchLog}
          className="text-gray-400 hover:text-white"
        >
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Subscription Funnel */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <FunnelCard
          label="Total"
          value={summary.total_studios}
          color="text-white"
        />
        <FunnelCard
          label="Trialing"
          value={summary.trialing}
          color="text-blue-400"
        />
        <FunnelCard
          label="Active"
          value={summary.active}
          color="text-green-400"
        />
        <FunnelCard
          label="Paying"
          value={summary.paying}
          color="text-emerald-400"
        />
        <FunnelCard
          label="Grace"
          value={summary.grace_period}
          color="text-yellow-400"
        />
        <FunnelCard
          label="Suspended"
          value={summary.suspended}
          color="text-red-400"
        />
        <FunnelCard
          label="Cancelled"
          value={summary.cancelled}
          color="text-gray-400"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tier Breakdown */}
        <SectionCard icon={CreditCard} title="Plan Distribution">
          <StatRow
            label="Elite"
            value={tier_breakdown.elite}
            color="text-purple-400"
          />
          <StatRow
            label="Pro"
            value={tier_breakdown.pro}
            color="text-blue-400"
          />
          <StatRow
            label="Starter"
            value={tier_breakdown.starter}
            color="text-yellow-400"
          />
          <StatRow
            label="Free / Trial"
            value={tier_breakdown.free}
            color="text-gray-400"
          />
          <div className="mt-3 pt-3 border-t border-white/10">
            <StatRow
              label="Stripe Connected"
              value={summary.stripe_connected}
              color="text-green-400"
            />
            <StatRow
              label="Stripe Subscribed"
              value={summary.stripe_subscribed}
              color="text-green-400"
            />
          </div>
        </SectionCard>

        {/* Accounts */}
        <SectionCard icon={Users} title="User Accounts">
          <StatRow label="Total Accounts" value={accounts.total} />
          <StatRow
            label="Active"
            value={accounts.active}
            color="text-green-400"
          />
          <StatRow
            label="Inactive"
            value={accounts.inactive}
            color="text-red-400"
          />
          <div className="mt-3 pt-3 border-t border-white/10">
            <StatRow label="Owners" value={accounts.roles.owner} />
            <StatRow label="Admins" value={accounts.roles.admin} />
            <StatRow label="Operators" value={accounts.roles.operator} />
            <StatRow label="Models" value={accounts.roles.model} />
            <StatRow
              label="Accountants"
              value={accounts.roles.accountant}
            />
          </div>
        </SectionCard>

        {/* Alerts */}
        <SectionCard
          icon={Bell}
          title={`Active Alerts (${alerts.total_active})`}
        >
          {alerts.by_studio.length === 0 ? (
            <p className="text-sm text-gray-500">No active alerts</p>
          ) : (
            alerts.by_studio.map((a) => (
              <div
                key={a.studio_id}
                className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0"
              >
                <span className="text-sm text-gray-400">
                  {a.studio_name}
                </span>
                <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                  {a.count} alerts
                </Badge>
              </div>
            ))
          )}
        </SectionCard>

        {/* Paying Studios */}
        <SectionCard
          icon={DollarSign}
          title={`Paying Studios (${paying_studios.length})`}
        >
          {paying_studios.length === 0 ? (
            <p className="text-sm text-gray-500">No paying studios yet</p>
          ) : (
            paying_studios.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0"
              >
                <div>
                  <span className="text-sm text-white">{s.name}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {s.tier}
                  </span>
                </div>
                {s.next_payment && (
                  <span className="text-xs text-gray-500">
                    Next:{" "}
                    {new Date(s.next_payment).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))
          )}
        </SectionCard>
      </div>

      {/* Trialing Studios */}
      {trialing_studios.length > 0 && (
        <SectionCard
          icon={Clock}
          title={`Trialing Studios (${trialing_studios.length})`}
        >
          <div className="space-y-2">
            {trialing_studios.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
              >
                <div>
                  <span className="text-sm text-white font-medium">
                    {s.name}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    {s.tier}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>
                    Created:{" "}
                    {s.created
                      ? new Date(s.created).toLocaleDateString()
                      : "N/A"}
                  </span>
                  <span>
                    Trial ends:{" "}
                    {s.grace_ends
                      ? new Date(s.grace_ends).toLocaleDateString()
                      : "N/A"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Grace Period Studios */}
      {grace_studios.length > 0 && (
        <SectionCard
          icon={AlertTriangle}
          title={`Grace Period Studios (${grace_studios.length})`}
        >
          <div className="space-y-2">
            {grace_studios.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
              >
                <div>
                  <span className="text-sm text-white font-medium">
                    {s.name}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    {s.tier}
                  </span>
                </div>
                <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                  Ends:{" "}
                  {s.grace_ends
                    ? new Date(s.grace_ends).toLocaleDateString()
                    : "N/A"}
                </Badge>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Registration Timeline */}
      <SectionCard
        icon={UserPlus}
        title="Registration Timeline (Last 30 Days)"
      >
        {daily_registrations.length === 0 ? (
          <p className="text-sm text-gray-500">
            No registrations in the last 30 days
          </p>
        ) : (
          <div className="space-y-3">
            {daily_registrations.map((day) => (
              <div
                key={day.date}
                className="border-b border-white/5 pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-white font-medium">
                    {day.date}
                  </span>
                  <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                    {day.studios.length}{" "}
                    {day.studios.length === 1 ? "studio" : "studios"}
                  </Badge>
                </div>
                <div className="pl-4 space-y-1">
                  {day.studios.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="text-gray-300">{s.name}</span>
                      <Badge className="text-[10px] px-1.5 py-0 bg-white/5 text-gray-400 border-white/10">
                        {s.tier}
                      </Badge>
                      <Badge
                        className={`text-[10px] px-1.5 py-0 ${
                          s.status === "active"
                            ? "bg-green-500/10 text-green-400"
                            : s.status === "trialing"
                              ? "bg-blue-500/10 text-blue-400"
                              : s.status === "suspended"
                                ? "bg-red-500/10 text-red-400"
                                : "bg-gray-500/10 text-gray-400"
                        }`}
                      >
                        {s.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
