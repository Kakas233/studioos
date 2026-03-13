"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wifi, WifiOff, User, Building2, RefreshCw, Loader2, Clock,
  Shield, Monitor, Headphones, Camera,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface LiveUser {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  role: string;
  last_seen_at: string;
  last_seen_page: string | null;
}

interface StudioGroup {
  studio_id: string;
  studio: {
    name: string;
    subdomain: string;
    tier: string;
    status: string;
  };
  online: LiveUser[];
  recent: LiveUser[];
}

interface LiveData {
  total_online: number;
  total_recent: number;
  studios: StudioGroup[];
}

const ROLE_ICONS: Record<string, typeof User> = {
  owner: Shield,
  admin: Shield,
  operator: Headphones,
  model: Camera,
  accountant: Monitor,
};

const ROLE_COLORS: Record<string, string> = {
  owner: "text-amber-400",
  admin: "text-purple-400",
  operator: "text-blue-400",
  model: "text-pink-400",
  accountant: "text-emerald-400",
};

const PAGE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/schedule": "Schedule",
  "/users": "User Management",
  "/rooms": "Rooms",
  "/accounting": "Accounting",
  "/payouts": "Payouts",
  "/stream-time": "Stream Time",
  "/model-insights": "Model Insights",
  "/model-lookup": "Model Lookup",
  "/model-search": "Model Search",
  "/member-lookup": "Member Lookup",
  "/member-alerts": "Member Alerts",
  "/chat": "Team Chat",
  "/billing": "Billing",
  "/settings": "Settings",
  "/data-backup": "Data & Backup",
};

function getPageLabel(path: string | null): string {
  if (!path) return "Unknown";
  return PAGE_LABELS[path] || path.replace(/^\//, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function LiveUsersTab() {
  const [data, setData] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLiveUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getLiveUsers" }),
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setError("");
      } else {
        setError(json.error || "Failed to load");
      }
    } catch {
      setError("Failed to fetch live users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveUsers();
    const interval = setInterval(fetchLiveUsers, 30_000); // refresh every 30s
    return () => clearInterval(interval);
  }, [fetchLiveUsers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-[#AA0608] animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-lg font-bold text-white">{data.total_online}</span>
            <span className="text-sm text-gray-400">online now</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-yellow-400/50 rounded-full" />
            <span className="text-lg font-bold text-white">{data.total_recent}</span>
            <span className="text-sm text-gray-400">active last 30min</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-400">
              {data.studios.filter((s) => s.online.length > 0).length} studios with active users
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => { setLoading(true); fetchLiveUsers(); }}
          className="text-gray-400 hover:text-white"
        >
          <RefreshCw className="w-4 h-4 mr-1" /> Refresh
        </Button>
      </div>

      {data.studios.length === 0 ? (
        <Card className="bg-[#0A0A0A] border-white/10">
          <CardContent className="py-12 text-center">
            <WifiOff className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No users are currently online</p>
            <p className="text-xs text-gray-600 mt-1">Users appear here after they open the app</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.studios.map((studio) => (
            <Card key={studio.studio_id} className="bg-[#0A0A0A] border-white/10">
              <CardContent className="p-0">
                {/* Studio header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#AA0608]/10 rounded-lg flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-[#AA0608]" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{studio.studio.name}</p>
                      <p className="text-[10px] text-gray-500">{studio.studio.subdomain}</p>
                    </div>
                    <Badge className={`text-[9px] ml-2 ${
                      studio.studio.status === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" :
                      studio.studio.status === "trialing" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                      "bg-gray-500/10 text-gray-400 border-gray-500/20"
                    }`}>
                      {studio.studio.tier} / {studio.studio.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    {studio.online.length > 0 && (
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <Wifi className="w-3.5 h-3.5" />
                        {studio.online.length} online
                      </span>
                    )}
                    {studio.recent.length > 0 && (
                      <span className="flex items-center gap-1.5 text-yellow-400/60">
                        <Clock className="w-3.5 h-3.5" />
                        {studio.recent.length} recent
                      </span>
                    )}
                  </div>
                </div>

                {/* User list */}
                <div className="divide-y divide-white/[0.03]">
                  {studio.online.map((user) => (
                    <UserRow key={user.id} user={user} status="online" />
                  ))}
                  {studio.recent.map((user) => (
                    <UserRow key={user.id} user={user} status="recent" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function UserRow({ user, status }: { user: LiveUser; status: "online" | "recent" }) {
  const RoleIcon = ROLE_ICONS[user.role] || User;
  const roleColor = ROLE_COLORS[user.role] || "text-gray-400";

  return (
    <div className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
            status === "online" ? "bg-emerald-500/10" : "bg-white/[0.04]"
          }`}>
            <RoleIcon className={`w-3.5 h-3.5 ${status === "online" ? roleColor : "text-gray-500"}`} />
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0A0A0A] ${
            status === "online" ? "bg-emerald-400" : "bg-yellow-400/50"
          }`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${status === "online" ? "text-white" : "text-gray-400"}`}>
              {user.first_name} {user.last_name || ""}
            </span>
            <Badge className={`text-[8px] px-1.5 py-0 ${
              user.role === "owner" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
              user.role === "admin" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
              user.role === "operator" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
              user.role === "model" ? "bg-pink-500/10 text-pink-400 border-pink-500/20" :
              "bg-gray-500/10 text-gray-400 border-gray-500/20"
            }`}>
              {user.role}
            </Badge>
          </div>
          <p className="text-[10px] text-gray-500">{user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-right">
        {user.last_seen_page && (
          <span className="text-[10px] text-gray-500 bg-white/[0.03] px-2 py-0.5 rounded">
            {getPageLabel(user.last_seen_page)}
          </span>
        )}
        <span className={`text-[10px] ${status === "online" ? "text-emerald-400/60" : "text-gray-600"}`}>
          {formatDistanceToNow(new Date(user.last_seen_at), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}
