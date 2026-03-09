"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronRight,
  Cloud,
  CloudOff,
  Plus,
  Pencil,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { format } from "date-fns";

const EVENT_CONFIG: Record<
  string,
  { label: string; color: string; icon: LucideIcon }
> = {
  create: {
    label: "Created",
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    icon: Plus,
  },
  update: {
    label: "Updated",
    color: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    icon: Pencil,
  },
  delete: {
    label: "Deleted",
    color: "bg-red-500/15 text-red-400 border-red-500/20",
    icon: Trash2,
  },
};

function DiffView({
  oldValues,
  newValues,
}: {
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
}) {
  if (!oldValues && !newValues) return null;
  const allKeys = [
    ...new Set([
      ...Object.keys(oldValues || {}),
      ...Object.keys(newValues || {}),
    ]),
  ];
  if (allKeys.length === 0) return null;

  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-[10px] uppercase tracking-wider text-white/30 font-semibold">
        Changes
      </p>
      <div className="bg-black/30 rounded-lg border border-white/[0.04] overflow-hidden">
        {allKeys.map((key) => (
          <div
            key={key}
            className="flex items-start text-xs border-b border-white/[0.03] last:border-0"
          >
            <div className="w-32 shrink-0 p-2 text-white/40 font-mono bg-white/[0.02]">
              {key}
            </div>
            <div className="flex-1 p-2 flex gap-2">
              {oldValues?.[key] !== undefined && (
                <span className="text-red-400/70 line-through">
                  {typeof oldValues[key] === "object"
                    ? JSON.stringify(oldValues[key])
                    : String(oldValues[key])}
                </span>
              )}
              {newValues?.[key] !== undefined && (
                <span className="text-emerald-400">
                  {typeof newValues[key] === "object"
                    ? JSON.stringify(newValues[key])
                    : String(newValues[key])}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface AuditLog {
  id: string;
  event_type: string;
  entity_type: string;
  summary?: string;
  actor_email?: string;
  created_at?: string;
  created_date?: string;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  synced_to_sheets?: boolean;
  studio_name?: string;
}

export default function AuditLogItem({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false);
  const config = EVENT_CONFIG[log.event_type] || EVENT_CONFIG.update;
  const Icon = config.icon;
  const hasDetails = log.old_values || log.new_values;
  const dateField = log.created_at || log.created_date;

  return (
    <div className="group bg-white/[0.02] hover:bg-white/[0.04] rounded-lg border border-white/[0.04] transition-colors">
      <div
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        <div className="p-1.5 rounded-md bg-white/[0.04]">
          <Icon className="w-3.5 h-3.5 text-white/50" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/90 truncate">{log.summary}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-white/30">
              {dateField
                ? format(new Date(dateField), "MMM d, yyyy HH:mm")
                : "\u2014"}
            </span>
            {log.actor_email && (
              <span className="text-[10px] text-white/25">
                by {log.actor_email}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className={`text-[10px] ${config.color}`}>
            {config.label}
          </Badge>
          <Badge
            variant="outline"
            className="text-[10px] bg-white/[0.03] text-white/50 border-white/[0.06]"
          >
            {log.entity_type}
          </Badge>
          {log.synced_to_sheets ? (
            <Cloud className="w-3.5 h-3.5 text-emerald-400/60" />
          ) : (
            <CloudOff className="w-3.5 h-3.5 text-white/20" />
          )}
          {hasDetails &&
            (expanded ? (
              <ChevronDown className="w-4 h-4 text-white/30" />
            ) : (
              <ChevronRight className="w-4 h-4 text-white/30" />
            ))}
        </div>
      </div>
      {expanded && hasDetails && (
        <div className="px-3 pb-3">
          <DiffView oldValues={log.old_values} newValues={log.new_values} />
        </div>
      )}
    </div>
  );
}
