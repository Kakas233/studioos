"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { useAuditLogs } from "@/hooks/use-studio-data";
import { Loader2, Database, Download, Shield, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { parseISO, format, formatDistanceToNow } from "date-fns";

const ACTION_COLORS: Record<string, string> = {
  create: "bg-emerald-500/10 text-emerald-400",
  update: "bg-blue-500/10 text-blue-400",
  delete: "bg-red-500/10 text-red-400",
  login: "bg-purple-500/10 text-purple-400",
  export: "bg-yellow-500/10 text-yellow-400",
};

export default function DataBackupPage() {
  const { isAdmin } = useAuth();
  const [page, setPage] = useState(0);
  const pageSize = 25;

  const { data: auditResult, isLoading } = useAuditLogs(page, pageSize);
  const auditLogs = auditResult?.data || [];
  const totalCount = auditResult?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#C9A84C]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-4 hover:border-white/[0.08] transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-[#C9A84C]" />
            <p className="text-sm font-medium text-white">Data Export</p>
          </div>
          <p className="text-xs text-[#A8A49A]/40 mb-3">
            Export your studio data in CSV or JSON format for backup or analysis.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="text-xs border-white/[0.08] text-[#A8A49A]/60 hover:text-white bg-transparent"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export Data
          </Button>
        </div>

        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-4 hover:border-white/[0.08] transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-emerald-400" />
            <p className="text-sm font-medium text-white">Audit Trail</p>
          </div>
          <p className="text-xs text-[#A8A49A]/40 mb-3">
            Track all changes and actions performed within your studio.
          </p>
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold text-white">{totalCount}</p>
            <p className="text-[10px] text-[#A8A49A]/30">total events</p>
          </div>
        </div>

        <div className="bg-[#111111] border border-white/[0.04] rounded-xl p-4 hover:border-white/[0.08] transition-colors">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <p className="text-sm font-medium text-white">Recovery</p>
          </div>
          <p className="text-xs text-[#A8A49A]/40 mb-3">
            Restore data from a previous point in time if needed.
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled
            className="text-xs border-white/[0.08] text-[#A8A49A]/30 bg-transparent"
          >
            Coming Soon
          </Button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#111111] border border-white/[0.04] rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between">
          <p className="text-sm font-medium text-white">Audit Log</p>
          <p className="text-xs text-[#A8A49A]/30">
            Page {page + 1} of {Math.max(totalPages, 1)}
          </p>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {auditLogs.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <Shield className="w-10 h-10 text-[#A8A49A]/20 mx-auto mb-3" />
              <p className="text-sm text-[#A8A49A]/40">No audit logs yet</p>
              <p className="text-xs text-[#A8A49A]/25 mt-1">
                Actions performed in your studio will be recorded here.
              </p>
            </div>
          ) : (
            auditLogs.map((log) => {
              const actionType = (log.event_type || "").split("_")[0] || "update";
              const colorClass =
                ACTION_COLORS[actionType] || "bg-white/[0.04] text-[#A8A49A]/40";

              return (
                <div
                  key={log.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge
                        variant="outline"
                        className={`text-[9px] capitalize border-transparent ${colorClass}`}
                      >
                        {log.event_type}
                      </Badge>
                      <span className="text-[10px] text-[#A8A49A]/25">
                        {log.entity_type}
                      </span>
                    </div>
                    <p className="text-xs text-[#A8A49A]/50 truncate">
                      {log.summary || `${log.event_type} on ${log.entity_type}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-[#A8A49A]/30">
                      {log.created_at
                        ? formatDistanceToNow(parseISO(log.created_at), {
                            addSuffix: true,
                          })
                        : "N/A"}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-white/[0.04] flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="text-xs text-[#A8A49A]/40 hover:text-white"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Previous
            </Button>
            <span className="text-xs text-[#A8A49A]/30">
              {page * pageSize + 1}-{Math.min((page + 1) * pageSize, totalCount)} of{" "}
              {totalCount}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="text-xs text-[#A8A49A]/40 hover:text-white"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
