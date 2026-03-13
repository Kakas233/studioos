import { createAdminClient } from "@/lib/supabase/admin";

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;

/**
 * Database-backed rate limiter. Persists across Vercel deploys.
 * Uses the error_logs table with error_type "rate_limit_attempt".
 */
export async function checkRateLimit(
  ip: string,
  action: "login" | "2fa"
): Promise<boolean> {
  const admin = createAdminClient();
  const windowStart = new Date(
    Date.now() - WINDOW_MINUTES * 60 * 1000
  ).toISOString();

  const { count } = await admin
    .from("error_logs")
    .select("*", { count: "exact", head: true })
    .eq("error_type", `rate_limit_${action}`)
    .eq("message", ip)
    .gte("created_at", windowStart);

  return (count || 0) < MAX_ATTEMPTS;
}

export async function recordRateLimitAttempt(
  ip: string,
  action: "login" | "2fa"
): Promise<void> {
  const admin = createAdminClient();
  await admin.from("error_logs").insert({
    error_type: `rate_limit_${action}`,
    message: ip,
    metadata: { action, timestamp: new Date().toISOString() },
  });
}
