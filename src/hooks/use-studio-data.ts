"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/auth-context";
import type { Database } from "@/lib/supabase/types";

type Tables = Database["public"]["Tables"];

const supabase = createClient();

export function useShifts() {
  const { studio } = useAuth();
  return useQuery<Tables["shifts"]["Row"][]>({
    queryKey: ["shifts", studio?.id],
    queryFn: async () => {
      if (!studio?.id) return [];
      const { data } = await supabase
        .from("shifts")
        .select("*")
        .eq("studio_id", studio.id)
        .order("start_time", { ascending: false });
      return data || [];
    },
    enabled: !!studio?.id,
  });
}

export function useEarnings() {
  const { studio } = useAuth();
  return useQuery<Tables["earnings"]["Row"][]>({
    queryKey: ["earnings", studio?.id],
    queryFn: async () => {
      if (!studio?.id) return [];
      const { data } = await supabase
        .from("earnings")
        .select("*")
        .eq("studio_id", studio.id)
        .order("shift_date", { ascending: false });
      return data || [];
    },
    enabled: !!studio?.id,
  });
}

export function useStudioAccounts() {
  const { studio } = useAuth();
  return useQuery<Tables["accounts"]["Row"][]>({
    queryKey: ["accounts", studio?.id],
    queryFn: async () => {
      if (!studio?.id) return [];
      const { data } = await supabase
        .from("accounts")
        .select("*")
        .eq("studio_id", studio.id)
        .order("first_name");
      return data || [];
    },
    enabled: !!studio?.id,
  });
}

export function useChangeRequests() {
  const { studio } = useAuth();
  return useQuery<Tables["shift_change_requests"]["Row"][]>({
    queryKey: ["shiftChangeRequests", studio?.id],
    queryFn: async () => {
      if (!studio?.id) return [];
      const { data } = await supabase
        .from("shift_change_requests")
        .select("*")
        .eq("studio_id", studio.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!studio?.id,
  });
}

export function useCamAccounts() {
  const { studio } = useAuth();
  return useQuery<Tables["cam_accounts"]["Row"][]>({
    queryKey: ["camAccounts", studio?.id],
    queryFn: async () => {
      if (!studio?.id) return [];
      const { data } = await supabase
        .from("cam_accounts")
        .select("*")
        .eq("studio_id", studio.id)
        .order("platform");
      return data || [];
    },
    enabled: !!studio?.id,
  });
}

export function useStudioDailyStats(camAccountIds: string[]) {
  const { studio } = useAuth();
  return useQuery<Tables["daily_stream_stats"]["Row"][]>({
    queryKey: ["dailyStreamStats", studio?.id, camAccountIds],
    queryFn: async () => {
      if (!studio?.id || !camAccountIds.length) return [];
      const { data } = await supabase
        .from("daily_stream_stats")
        .select("*")
        .eq("studio_id", studio.id)
        .in("cam_account_id", camAccountIds)
        .order("date", { ascending: false });
      return data || [];
    },
    enabled: !!studio?.id && camAccountIds.length > 0,
  });
}

export function useStreamingSessions(camAccountIds: string[]) {
  const { studio } = useAuth();
  return useQuery<Tables["streaming_sessions"]["Row"][]>({
    queryKey: ["streamingSessions", studio?.id, camAccountIds],
    queryFn: async () => {
      if (!studio?.id || !camAccountIds.length) return [];
      const { data } = await supabase
        .from("streaming_sessions")
        .select("*")
        .eq("studio_id", studio.id)
        .in("cam_account_id", camAccountIds);
      return data || [];
    },
    enabled: !!studio?.id && camAccountIds.length > 0,
    refetchInterval: 30000,
  });
}

export function useRooms() {
  const { studio } = useAuth();
  return useQuery<Tables["rooms"]["Row"][]>({
    queryKey: ["rooms", studio?.id],
    queryFn: async () => {
      if (!studio?.id) return [];
      const { data } = await supabase
        .from("rooms")
        .select("*")
        .eq("studio_id", studio.id)
        .order("name");
      return data || [];
    },
    enabled: !!studio?.id,
  });
}

export function useGlobalSettings() {
  const { studio } = useAuth();
  return useQuery<Tables["global_settings"]["Row"] | null>({
    queryKey: ["globalSettings", studio?.id],
    queryFn: async () => {
      if (!studio?.id) return null;
      const { data } = await supabase
        .from("global_settings")
        .select("*")
        .eq("studio_id", studio.id)
        .single();
      return data;
    },
    enabled: !!studio?.id,
  });
}

export function usePayouts() {
  const { studio } = useAuth();
  return useQuery<Tables["payouts"]["Row"][]>({
    queryKey: ["payouts", studio?.id],
    queryFn: async () => {
      if (!studio?.id) return [];
      const { data } = await supabase
        .from("payouts")
        .select("*")
        .eq("studio_id", studio.id)
        .order("period_end", { ascending: false });
      return data || [];
    },
    enabled: !!studio?.id,
  });
}

export function useSupportTickets() {
  const { studio } = useAuth();
  return useQuery<Tables["support_tickets"]["Row"][]>({
    queryKey: ["supportTickets", studio?.id],
    queryFn: async () => {
      if (!studio?.id) return [];
      const { data } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("studio_id", studio.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!studio?.id,
  });
}

export function useAuditLogs(page = 0, pageSize = 50) {
  const { studio } = useAuth();
  return useQuery<{ data: Tables["audit_logs"]["Row"][]; count: number }>({
    queryKey: ["auditLogs", studio?.id, page, pageSize],
    queryFn: async () => {
      if (!studio?.id) return { data: [], count: 0 };
      const from = page * pageSize;
      const to = from + pageSize - 1;
      const { data, count } = await supabase
        .from("audit_logs")
        .select("*", { count: "exact" })
        .eq("studio_id", studio.id)
        .order("created_at", { ascending: false })
        .range(from, to);
      return { data: data || [], count: count || 0 };
    },
    enabled: !!studio?.id,
  });
}

export function useChatChannels() {
  const { studio } = useAuth();
  return useQuery<Tables["chat_channels"]["Row"][]>({
    queryKey: ["chatChannels", studio?.id],
    queryFn: async () => {
      if (!studio?.id) return [];
      const { data } = await supabase
        .from("chat_channels")
        .select("*")
        .eq("studio_id", studio.id)
        .order("name");
      return data || [];
    },
    enabled: !!studio?.id,
  });
}

export function useAssignments() {
  const { studio } = useAuth();
  return useQuery<Tables["assignments"]["Row"][]>({
    queryKey: ["assignments", studio?.id],
    queryFn: async () => {
      if (!studio?.id) return [];
      const { data } = await supabase
        .from("assignments")
        .select("*")
        .eq("studio_id", studio.id);
      return data || [];
    },
    enabled: !!studio?.id,
  });
}
