"use client";

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
    { label: "Today", value: todayLogs.length },
    { label: "Creates", value: creates },
    { label: "Updates", value: updates },
    { label: "Deletes", value: deletes },
    { label: "Synced", value: syncedCount },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="border border-white/[0.06] rounded-xl bg-white/[0.02] p-4"
        >
          <p className="text-[10px] text-[#A8A49A]/40 uppercase tracking-wider mb-1">{s.label}</p>
          <p className="text-xl font-semibold text-white">{s.value}</p>
        </div>
      ))}
    </div>
  );
}
