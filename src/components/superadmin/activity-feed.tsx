"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  RefreshCw,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Filter,
  X,
  type LucideIcon,
} from "lucide-react";

const EVENT_ICONS: Record<
  string,
  { icon: LucideIcon; color: string; bg: string }
> = {
  create: { icon: Plus, color: "text-green-400", bg: "bg-green-500/10" },
  update: { icon: Pencil, color: "text-blue-400", bg: "bg-blue-500/10" },
  delete: { icon: Trash2, color: "text-red-400", bg: "bg-red-500/10" },
};

interface StudioRef {
  id: string;
  name: string;
}

interface LogEntry {
  id: string;
  event_type: string;
  summary: string;
  studio_name?: string;
  actor_email?: string;
  created_date?: string;
}

interface ActivityFeedProps {
  allStudios?: StudioRef[];
}

export default function ActivityFeed(_props: ActivityFeedProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [studios, setStudios] = useState<StudioRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [studioFilter, setStudioFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchLogs = async (
    filters: {
      studio_id?: string;
      date_from?: string;
      date_to?: string;
    } = {}
  ) => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({

          action: "getActivityFeed",
          payload: {
            studio_id:
              filters.studio_id ||
              (studioFilter !== "all" ? studioFilter : undefined),
            date_from: filters.date_from || dateFrom || undefined,
            date_to: filters.date_to || dateTo || undefined,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data.logs || []);
        if (data.data.studios) setStudios(data.data.studios);
      }
    } catch (err) {
      console.error("Failed to fetch activity feed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = () => {
    fetchLogs({
      studio_id: studioFilter !== "all" ? studioFilter : undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    });
  };

  const clearFilters = () => {
    setStudioFilter("all");
    setDateFrom("");
    setDateTo("");
    fetchLogs({
      studio_id: undefined,
      date_from: undefined,
      date_to: undefined,
    });
  };

  const hasFilters = studioFilter !== "all" || dateFrom || dateTo;

  const timeAgo = (dateStr?: string) => {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Card className="bg-[#0A0A0A] border-white/10">
      <CardHeader className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#AA0608]" /> Activity Feed
            <span className="text-xs text-gray-500 font-normal ml-2">
              ({logs.length} entries)
            </span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchLogs()}
            disabled={loading}
            className="text-gray-400 hover:text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <Select value={studioFilter} onValueChange={(v) => v !== null && setStudioFilter(v)}>
            <SelectTrigger className="w-48 h-8 bg-white/5 border-white/10 text-white text-xs">
              <span className="truncate">{studioFilter === "all" ? "All Studios" : (studios.find((s) => s.id === studioFilter)?.name || "All Studios")}</span>
            </SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-white/10">
              <SelectItem
                value="all"
                className="text-gray-300 text-xs"
              >
                All Studios
              </SelectItem>
              {studios.map((s) => (
                <SelectItem
                  key={s.id}
                  value={s.id}
                  className="text-gray-300 text-xs"
                >
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="From"
            className="w-36 h-8 bg-white/5 border-white/10 text-white text-xs"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="To"
            className="w-36 h-8 bg-white/5 border-white/10 text-white text-xs"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={applyFilters}
            className="h-8 text-xs text-[#AA0608] hover:text-[#AA0608]/80"
          >
            Apply
          </Button>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 text-xs text-gray-400 hover:text-white"
            >
              <X className="w-3 h-3 mr-1" /> Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading && logs.length === 0 ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No activity found</p>
        ) : (
          <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
            {logs.map((log) => {
              const ev = EVENT_ICONS[log.event_type] || EVENT_ICONS.update;
              const Icon = ev.icon;
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 py-2.5 border-b border-white/5 last:border-0"
                >
                  <div
                    className={`w-7 h-7 rounded-lg ${ev.bg} flex items-center justify-center shrink-0 mt-0.5`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${ev.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/90 leading-snug">
                      {log.summary}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {log.studio_name && (
                        <Badge className="bg-white/5 text-gray-500 border-white/10 text-[10px] px-1.5 py-0">
                          {log.studio_name}
                        </Badge>
                      )}
                      <span className="text-[10px] text-gray-600">
                        {log.actor_email || "System"}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right mt-1">
                    <span className="text-[10px] text-gray-600">
                      {timeAgo(log.created_date)}
                    </span>
                    <p className="text-[9px] text-gray-700">
                      {log.created_date
                        ? new Date(log.created_date).toLocaleDateString()
                        : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
