"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import {
  useShifts,
  useEarnings,
  useStudioAccounts,
  useAuditLogs,
} from "@/hooks/use-studio-data";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield } from "lucide-react";
import AuditStats from "@/components/audit/audit-stats";
import AuditFilters from "@/components/audit/audit-filters";
import AuditTimeline from "@/components/audit/audit-timeline";
import ExportSection from "@/components/audit/export-section";
import type { AuditLog } from "@/components/audit/audit-log-item";

export default function DataBackupPage() {
  const router = useRouter();
  const { account, studio, loading: authLoading } = useAuth();
  const isAdmin = account?.role === "admin" || account?.role === "owner";
  const isSuperAdmin = account?.is_super_admin;

  const [filters, setFilters] = useState({
    search: "",
    entityType: "all",
    eventType: "all",
    dateFrom: "",
    dateTo: "",
  });

  // Pagination for audit logs - load a large set
  const [page] = useState(0);
  const pageSize = 500;

  const { data: allAccounts = [] } = useStudioAccounts();
  const { data: shifts = [] } = useShifts();
  const { data: earnings = [] } = useEarnings();

  // Fetch audit logs
  const { data: auditResult, isLoading: logsLoading } = useAuditLogs(
    page,
    pageSize
  );
  const auditLogs: AuditLog[] = (auditResult?.data || []).map((log) => ({
    ...log,
    event_type: log.event_type || "",
    entity_type: log.entity_type || "",
    summary: log.summary || undefined,
    actor_email: log.actor_email || undefined,
    old_values: log.old_data as Record<string, unknown> | null,
    new_values: log.new_data as Record<string, unknown> | null,
    synced_to_sheets: false,
  }));

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      if (
        filters.entityType !== "all" &&
        log.entity_type !== filters.entityType
      )
        return false;
      if (filters.eventType !== "all" && log.event_type !== filters.eventType)
        return false;
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const match =
          (log.summary || "").toLowerCase().includes(s) ||
          (log.actor_email || "").toLowerCase().includes(s) ||
          (log.entity_type || "").toLowerCase().includes(s) ||
          (log.studio_name || "").toLowerCase().includes(s);
        if (!match) return false;
      }
      if (filters.dateFrom) {
        const dateField = log.created_at || log.created_date;
        const logDate = dateField?.split("T")[0];
        if (logDate && logDate < filters.dateFrom) return false;
      }
      if (filters.dateTo) {
        const dateField = log.created_at || log.created_date;
        const logDate = dateField?.split("T")[0];
        if (logDate && logDate > filters.dateTo) return false;
      }
      return true;
    });
  }, [auditLogs, filters]);

  useEffect(() => {
    if (!authLoading && (!account || !isAdmin)) {
      router.push(account ? "/dashboard" : "/sign-in");
    }
  }, [authLoading, account, isAdmin, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!account || !isAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-[#C9A84C]/10 rounded-xl">
          <Shield className="w-5 h-5 text-[#C9A84C]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Audit & Recovery</h2>
          <p className="text-white/50 text-sm">
            Track every change, export backups, and sync to Google Sheets
          </p>
        </div>
      </div>

      <AuditStats logs={auditLogs} />

      <Tabs defaultValue="timeline" className="w-full">
        <TabsList className="bg-white/[0.05] border border-white/[0.04]">
          <TabsTrigger value="timeline">Activity Timeline</TabsTrigger>
          <TabsTrigger value="export">Export & Backup</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4 space-y-4">
          <AuditFilters
            filters={filters}
            onChange={setFilters}
            onClear={() =>
              setFilters({
                search: "",
                entityType: "all",
                eventType: "all",
                dateFrom: "",
                dateTo: "",
              })
            }
          />
          {logsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <AuditTimeline logs={filteredLogs} />
          )}
        </TabsContent>

        <TabsContent value="export" className="mt-4">
          <ExportSection
            shifts={shifts as Record<string, unknown>[]}
            earnings={earnings as Record<string, unknown>[]}
            accounts={allAccounts as Record<string, unknown>[]}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
