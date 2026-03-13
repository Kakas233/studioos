"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import type { Database } from "@/lib/supabase/types";

type Tables = Database["public"]["Tables"];

const supabase = createClient();

export function useShifts(options?: { dateFrom?: string; dateTo?: string }) {
  const { account } = useAuth();
  const studioId = account?.studio_id;
  // Stable date string (day precision) so query key doesn't change on every render
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const effectiveDateFrom = options?.dateFrom ?? sixtyDaysAgo;
  return useQuery<Tables["shifts"]["Row"][]>({
    queryKey: ["shifts", studioId, effectiveDateFrom, options?.dateTo],
    queryFn: async () => {
      if (!studioId) return [];
      let query = supabase
        .from("shifts")
        .select("*")
        .eq("studio_id", studioId)
        .gte("start_time", effectiveDateFrom)
        .order("start_time", { ascending: false });
      if (options?.dateTo) query = query.lte("start_time", options.dateTo);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data || [];
    },
    enabled: !!studioId,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useEarnings(options?: { dateFrom?: string; dateTo?: string }) {
  const { account } = useAuth();
  const studioId = account?.studio_id;
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const effectiveDateFrom = options?.dateFrom ?? ninetyDaysAgo;
  return useQuery<Tables["earnings"]["Row"][]>({
    queryKey: ["earnings", studioId, effectiveDateFrom, options?.dateTo],
    queryFn: async () => {
      if (!studioId) return [];
      let query = supabase
        .from("earnings")
        .select("*")
        .eq("studio_id", studioId)
        .gte("shift_date", effectiveDateFrom)
        .order("shift_date", { ascending: false });
      if (options?.dateTo) query = query.lte("shift_date", options.dateTo);
      const { data } = await query;
      return data || [];
    },
    enabled: !!studioId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useStudioAccounts() {
  const { account } = useAuth();
  const studioId = account?.studio_id;
  return useQuery<Tables["accounts"]["Row"][]>({
    queryKey: ["accounts", studioId],
    queryFn: async () => {
      if (!studioId) return [];
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("studio_id", studioId)
        .order("first_name");
      if (error) throw new Error(`useStudioAccounts: ${error.message}`);
      return data || [];
    },
    enabled: !!studioId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useChangeRequests() {
  const { account } = useAuth();
  const studioId = account?.studio_id;
  return useQuery<Tables["shift_change_requests"]["Row"][]>({
    queryKey: ["shiftChangeRequests", studioId],
    queryFn: async () => {
      if (!studioId) return [];
      const { data } = await supabase
        .from("shift_change_requests")
        .select("*")
        .eq("studio_id", studioId)
        .order("created_at", { ascending: false })
        .limit(200);
      return data || [];
    },
    enabled: !!studioId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCamAccounts() {
  const { account } = useAuth();
  const studioId = account?.studio_id;
  return useQuery<Tables["cam_accounts"]["Row"][]>({
    queryKey: ["camAccounts", studioId],
    queryFn: async () => {
      if (!studioId) return [];
      const { data } = await supabase
        .from("cam_accounts")
        .select("*")
        .eq("studio_id", studioId)
        .order("platform");
      return data || [];
    },
    enabled: !!studioId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useStudioDailyStats(camAccountIds: string[]) {
  const { account } = useAuth();
  const studioId = account?.studio_id;
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  return useQuery<Tables["daily_stream_stats"]["Row"][]>({
    queryKey: ["dailyStreamStats", studioId, camAccountIds, ninetyDaysAgo],
    queryFn: async () => {
      if (!studioId || !camAccountIds.length) return [];
      const { data } = await supabase
        .from("daily_stream_stats")
        .select("*")
        .eq("studio_id", studioId)
        .in("cam_account_id", camAccountIds)
        .gte("date", ninetyDaysAgo)
        .order("date", { ascending: false })
        .limit(1000);
      return data || [];
    },
    enabled: !!studioId && camAccountIds.length > 0,
    staleTime: 2 * 60 * 1000,
  });
}

export function useStreamingSessions(camAccountIds: string[]) {
  const { account } = useAuth();
  const studioId = account?.studio_id;
  return useQuery<Tables["streaming_sessions"]["Row"][]>({
    queryKey: ["streamingSessions", studioId, camAccountIds],
    queryFn: async () => {
      if (!studioId || !camAccountIds.length) return [];
      const { data } = await supabase
        .from("streaming_sessions")
        .select("*")
        .eq("studio_id", studioId)
        .in("cam_account_id", camAccountIds)
        .limit(200);
      return data || [];
    },
    enabled: !!studioId && camAccountIds.length > 0,
    refetchInterval: 60000,
    staleTime: 30 * 1000,
  });
}

export interface ModelActivity {
  cam_account_id: string;
  is_live: boolean;
  show_type: string;
  display_name: string;
  updated_at: string | null;
}

export function useModelCurrentActivity() {
  const { account } = useAuth();
  const studioId = account?.studio_id;
  return useQuery<Record<string, ModelActivity>>({
    queryKey: ["modelCurrentActivity", studioId],
    queryFn: async () => {
      if (!studioId) return {};
      const res = await fetch("/api/model-activity");
      if (!res.ok) return {};
      return res.json();
    },
    enabled: !!studioId,
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
}

export function useRooms() {
  const { account } = useAuth();
  const studioId = account?.studio_id;
  return useQuery<Tables["rooms"]["Row"][]>({
    queryKey: ["rooms", studioId],
    queryFn: async () => {
      if (!studioId) return [];
      const { data } = await supabase
        .from("rooms")
        .select("*")
        .eq("studio_id", studioId)
        .order("name");
      return data || [];
    },
    enabled: !!studioId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGlobalSettings() {
  const { account } = useAuth();
  const studioId = account?.studio_id;
  return useQuery<Tables["global_settings"]["Row"] | null>({
    queryKey: ["globalSettings", studioId],
    queryFn: async () => {
      if (!studioId) return null;
      const { data } = await supabase
        .from("global_settings")
        .select("*")
        .eq("studio_id", studioId)
        .single();
      return data;
    },
    enabled: !!studioId,
    staleTime: 10 * 60 * 1000,
  });
}

export function usePayouts() {
  const { account } = useAuth();
  const studioId = account?.studio_id;
  return useQuery<Tables["payouts"]["Row"][]>({
    queryKey: ["payouts", studioId],
    queryFn: async () => {
      if (!studioId) return [];
      const { data } = await supabase
        .from("payouts")
        .select("*")
        .eq("studio_id", studioId)
        .order("period_end", { ascending: false })
        .limit(500);
      return data || [];
    },
    enabled: !!studioId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useSupportTickets() {
  const { account } = useAuth();
  const studioId = account?.studio_id;
  return useQuery<Tables["support_tickets"]["Row"][]>({
    queryKey: ["supportTickets", studioId],
    queryFn: async () => {
      if (!studioId) return [];
      const { data } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("studio_id", studioId)
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
    enabled: !!studioId,
  });
}

export function useAuditLogs(page = 0, pageSize = 50) {
  const { account } = useAuth();
  const studioId = account?.studio_id;
  return useQuery<{ data: Tables["audit_logs"]["Row"][]; count: number }>({
    queryKey: ["auditLogs", studioId, page, pageSize],
    queryFn: async () => {
      if (!studioId) return { data: [], count: 0 };
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data, count } = await supabase
        .from("audit_logs")
        .select("*", { count: "exact" })
        .eq("studio_id", studioId)
        .order("created_at", { ascending: false })
        .range(from, to);
      return { data: data || [], count: count || 0 };
    },
    enabled: !!studioId,
  });
}

export function useChatChannels() {
  const { account } = useAuth();
  const studioId = account?.studio_id;
  return useQuery<Tables["chat_channels"]["Row"][]>({
    queryKey: ["chatChannels", studioId],
    queryFn: async () => {
      if (!studioId) return [];
      const { data, error } = await supabase
        .from("chat_channels")
        .select("*")
        .eq("studio_id", studioId)
        .order("name");
      if (error) throw new Error(`useChatChannels: ${error.message}`);
      return data || [];
    },
    enabled: !!studioId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAssignments() {
  const { account } = useAuth();
  const studioId = account?.studio_id;
  return useQuery<Tables["assignments"]["Row"][]>({
    queryKey: ["assignments", studioId],
    queryFn: async () => {
      if (!studioId) return [];
      const { data } = await supabase
        .from("assignments")
        .select("*")
        .eq("studio_id", studioId);
      return data || [];
    },
    enabled: !!studioId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useShiftRequests() {
  const { account } = useAuth();
  const studioId = account?.studio_id;
  return useQuery<Tables["shift_requests"]["Row"][]>({
    queryKey: ["shiftRequests", studioId],
    queryFn: async () => {
      if (!studioId) return [];
      const { data } = await supabase
        .from("shift_requests")
        .select("*")
        .eq("studio_id", studioId)
        .order("created_at", { ascending: false })
        .limit(200);
      return data || [];
    },
    enabled: !!studioId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useStreamSegments(
  camAccountIds: string[],
  dateFrom?: string,
  dateTo?: string
) {
  const { account } = useAuth();
  const studioId = account?.studio_id;
  const effectiveDateFrom = dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  return useQuery<Tables["stream_segments"]["Row"][]>({
    queryKey: ["streamSegments", studioId, camAccountIds, effectiveDateFrom, dateTo],
    queryFn: async () => {
      if (!studioId || !camAccountIds.length) return [];
      let query = supabase
        .from("stream_segments")
        .select("*")
        .eq("studio_id", studioId)
        .in("cam_account_id", camAccountIds)
        .gte("date", effectiveDateFrom)
        .order("start_time", { ascending: false });
      if (dateTo) query = query.lte("date", dateTo);
      query = query.limit(2000);
      const { data } = await query;
      return data || [];
    },
    enabled: !!studioId && camAccountIds.length > 0,
    staleTime: 2 * 60 * 1000,
  });
}

export function useShiftAnalysis() {
  const { account } = useAuth();
  const studioId = account?.studio_id;
  return useQuery<Tables["shift_analyses"]["Row"][]>({
    queryKey: ["shiftAnalyses", studioId],
    queryFn: async () => {
      if (!studioId) return [];
      const { data } = await supabase
        .from("shift_analyses")
        .select("*")
        .eq("studio_id", studioId)
        .order("shift_date", { ascending: false })
        .limit(500);
      return data || [];
    },
    enabled: !!studioId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDataFetchJobs() {
  const { account } = useAuth();
  const studioId = account?.studio_id;
  return useQuery<Tables["data_fetch_jobs"]["Row"][]>({
    queryKey: ["dataFetchJobs", studioId],
    queryFn: async () => {
      if (!studioId) return [];
      const { data } = await supabase
        .from("data_fetch_jobs")
        .select("*")
        .eq("studio_id", studioId)
        .order("created_at", { ascending: false })
        .limit(100);
      return data || [];
    },
    enabled: !!studioId,
    staleTime: 5 * 1000,
    refetchInterval: 15000,
  });
}
