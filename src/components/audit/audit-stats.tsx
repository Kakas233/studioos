"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Activity, FileText, AlertTriangle, CheckCircle, Cloud } from "lucide-react";
import type { AuditLog } from "./audit-log-item";

export default function AuditStats({ logs }: { logs: AuditLog[] }) {
  const today = new Date().toISOString().split("T")[0];
  const todayLogs = logs.filter(
    (l) => (l.created_at || l.created_date)?.startsWith(today)
  );
  const creates = logs.filter((l) => l.event_type === "create").length;
  const updates = logs.filter((l) => l.event_type === "update").length;
  const deletes = logs.filter((l) => l.event_type === "delete").length;
  const syncedCount = logs.filter((l) => l.synced_to_sheets).length;

  const stats = [
    {
      label: "Today's Events",
      value: todayLogs.length,
      icon: Activity,
      color: "blue",
    },
    { label: "Creates", value: creates, icon: FileText, color: "emerald" },
    { label: "Updates", value: updates, icon: CheckCircle, color: "amber" },
    { label: "Deletes", value: deletes, icon: AlertTriangle, color: "red" },
    {
      label: "Synced to Sheets",
      value: syncedCount,
      icon: Cloud,
      color: "purple",
    },
  ];

  const bgClasses: Record<string, string> = {
    blue: "bg-blue-500/10",
    emerald: "bg-emerald-500/10",
    amber: "bg-amber-500/10",
    red: "bg-red-500/10",
    purple: "bg-purple-500/10",
  };
  const textClasses: Record<string, string> = {
    blue: "text-blue-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    red: "text-red-400",
    purple: "text-purple-400",
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((s) => (
        <Card
          key={s.label}
          className="bg-[#111111]/80 border-white/[0.04]"
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 ${bgClasses[s.color]} rounded-xl`}>
                <s.icon className={`w-4 h-4 ${textClasses[s.color]}`} />
              </div>
              <div>
                <p className="text-xs text-white/50">{s.label}</p>
                <p className="text-xl font-bold text-white">{s.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
