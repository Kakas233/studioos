"use client";

import { useState, useMemo } from "react";
import AuditLogItem, { type AuditLog } from "./audit-log-item";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

function groupByDate(logs: AuditLog[]): [string, AuditLog[]][] {
  const groups: Record<string, AuditLog[]> = {};
  logs.forEach((log) => {
    const dateField = log.created_at || log.created_date;
    const d = dateField ? dateField.split("T")[0] : "unknown";
    if (!groups[d]) groups[d] = [];
    groups[d].push(log);
  });
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
}

function formatDateLabel(dateStr: string): string {
  if (dateStr === "unknown") return "Unknown Date";
  const d = new Date(dateStr + "T00:00:00");
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, MMMM d, yyyy");
}

export default function AuditTimeline({ logs }: { logs: AuditLog[] }) {
  const [showCount, setShowCount] = useState(50);
  const visibleLogs = useMemo(
    () => logs.slice(0, showCount),
    [logs, showCount]
  );
  const grouped = useMemo(() => groupByDate(visibleLogs), [visibleLogs]);

  if (logs.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-white/30 text-sm">
          No audit logs yet. Changes to your data will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {grouped.map(([date, dateLogs]) => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-white/[0.06]" />
            <span className="text-xs text-white/30 font-medium">
              {formatDateLabel(date)}
            </span>
            <span className="text-[10px] text-white/20">
              {dateLogs.length} events
            </span>
            <div className="h-px flex-1 bg-white/[0.06]" />
          </div>
          <div className="space-y-1.5">
            {dateLogs.map((log) => (
              <AuditLogItem key={log.id} log={log} />
            ))}
          </div>
        </div>
      ))}
      {logs.length > showCount && (
        <div className="text-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCount((s) => s + 50)}
            className="border-white/[0.06] text-white/50 hover:text-white"
          >
            <ChevronDown className="w-4 h-4 mr-1" /> Load More (
            {logs.length - showCount} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}
