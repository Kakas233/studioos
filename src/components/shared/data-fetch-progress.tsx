"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useDataFetchJobs } from "@/hooks/use-studio-data";
import { createClient } from "@/lib/supabase/client";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Database,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STALE_JOB_MS = 60 * 60 * 1000;
const MIN_AGE_BEFORE_STALE_CHECK_MS = 5 * 60 * 1000;

interface Job {
  id: string;
  status: string;
  platform?: string;
  username?: string;
  model_name?: string;
  started_at?: string | null;
  created_at: string;
  completed_at?: string | null;
  error_message?: string | null;
  total_pages?: number | null;
  pages_fetched?: number | null;
  days_processed?: number | null;
  estimated_minutes_remaining?: number | null;
  _stale?: boolean;
}

export default function DataFetchProgress({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { data: jobs = [] } = useDataFetchJobs();
  const queryClient = useQueryClient();
  const supabase = createClient();

  const now = new Date();
  const activeJobs = (jobs as Job[]).filter((j) => {
    if (j.status === "pending" || j.status === "in_progress") {
      const jobStart = j.started_at
        ? new Date(j.started_at)
        : new Date(j.created_at);
      const jobAge = now.getTime() - jobStart.getTime();
      if (
        jobAge > STALE_JOB_MS &&
        jobAge > MIN_AGE_BEFORE_STALE_CHECK_MS
      ) {
        j._stale = true;
      }
      return true;
    }
    if (j.status === "completed" && j.completed_at) {
      const completed = new Date(j.completed_at);
      return now.getTime() - completed.getTime() < 5 * 60 * 1000;
    }
    if (j.status === "failed") return true;
    return false;
  });

  const dismissJob = async (jobId: string) => {
    try {
      await supabase
        .from("data_fetch_jobs")
        .update({
          status: "completed",
          error_message: "Dismissed by user",
          completed_at: new Date().toISOString(),
        })
        .eq("id", jobId);
      queryClient.invalidateQueries({ queryKey: ["dataFetchJobs"] });
    } catch (err) {
      console.error("Failed to dismiss job:", err);
    }
  };

  if (activeJobs.length === 0) return null;

  const pendingOrActive = activeJobs.filter(
    (j) => j.status === "pending" || j.status === "in_progress"
  );

  if (compact) {
    if (pendingOrActive.length === 0) return null;
    const staleCount = pendingOrActive.filter((j) => j._stale).length;
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#C9A84C]/10 rounded-lg border border-[#C9A84C]/20">
        {staleCount === pendingOrActive.length ? (
          <>
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-amber-400 flex-1">
              Fetch appears stuck for {staleCount} account
              {staleCount > 1 ? "s" : ""}
            </span>
            <button
              onClick={() =>
                pendingOrActive.forEach(
                  (j) => j._stale && dismissJob(j.id)
                )
              }
              className="text-[10px] text-red-400 hover:text-red-300 font-medium shrink-0"
            >
              Dismiss
            </button>
          </>
        ) : (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C9A84C]" />
            <span className="text-xs text-[#C9A84C]">
              Fetching data for {pendingOrActive.length} account
              {pendingOrActive.length > 1 ? "s" : ""}...
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {activeJobs.map((job) => (
          <JobCard key={job.id} job={job} onDismiss={dismissJob} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function JobCard({
  job,
  onDismiss,
}: {
  job: Job;
  onDismiss: (id: string) => void;
}) {
  const isActive =
    job.status === "pending" || job.status === "in_progress";
  const isCompleted = job.status === "completed";
  const isFailed = job.status === "failed";
  const isStale = job._stale;

  let progress = 0;
  if (
    (job.total_pages ?? 0) > 0 &&
    (job.pages_fetched ?? 0) > 0
  ) {
    progress = Math.min(
      95,
      Math.round(
        ((job.pages_fetched ?? 0) / (job.total_pages ?? 1)) * 80
      )
    );
  }
  if (isCompleted) progress = 100;
  if (job.status === "pending") progress = 2;

  const estimatedMins = job.estimated_minutes_remaining || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className={`p-4 rounded-xl border transition-all ${
        isCompleted
          ? "bg-emerald-500/5 border-emerald-500/20"
          : isFailed
          ? "bg-red-500/5 border-red-500/20"
          : "bg-[#C9A84C]/5 border-[#C9A84C]/15"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            isCompleted
              ? "bg-emerald-500/10"
              : isFailed
              ? "bg-red-500/10"
              : "bg-[#C9A84C]/10"
          }`}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : isFailed ? (
            <AlertCircle className="w-4 h-4 text-red-400" />
          ) : (
            <Database className="w-4 h-4 text-[#C9A84C] animate-pulse" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {job.platform}
              </p>
              <span className="text-xs text-[#A8A49A]/40">
                &bull;
              </span>
              <p className="text-xs text-[#A8A49A]/50 truncate">
                {job.username}
              </p>
              {job.model_name && (
                <>
                  <span className="text-xs text-[#A8A49A]/40">
                    &bull;
                  </span>
                  <p className="text-xs text-[#A8A49A]/50 truncate">
                    {job.model_name}
                  </p>
                </>
              )}
            </div>
            {isActive && estimatedMins > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                <Clock className="w-3 h-3 text-[#A8A49A]/40" />
                <span className="text-[10px] text-[#A8A49A]/50 font-medium whitespace-nowrap">
                  ~{estimatedMins} min left
                </span>
              </div>
            )}
          </div>

          {isActive && !isStale && (
            <>
              <div className="mb-1.5">
                <Progress
                  value={progress}
                  className="h-1.5 bg-white/[0.04] [&>div]:bg-[#C9A84C]"
                />
              </div>
              <p className="text-[10px] text-[#A8A49A]/40">
                {job.status === "pending"
                  ? "Preparing to fetch 30 days of historical data..."
                  : `Fetching 30 days of data \u2014 ${
                      job.days_processed || 0
                    } days processed`}
              </p>
            </>
          )}

          {isActive && isStale && (
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-amber-400/80">
                This fetch appears to be stuck (running for 60+
                minutes). You can dismiss it and try again.
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(job.id);
                }}
                className="text-[10px] text-red-400 hover:text-red-300 font-medium shrink-0 ml-2"
              >
                Dismiss
              </button>
            </div>
          )}

          {isCompleted && (
            <p className="text-[10px] text-emerald-400/70">
              Completed &mdash; {job.days_processed || 0} days of
              historical data fetched successfully
            </p>
          )}

          {isFailed && (
            <p className="text-[10px] text-red-400/70">
              Failed
              {job.error_message ? `: ${job.error_message}` : ""}.
              Data will be retried automatically.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
