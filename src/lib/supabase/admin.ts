import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import "@/lib/env"; // Validate env vars on first import

/**
 * Supabase admin client with service_role key (singleton).
 * ONLY use in server-side code (API routes, Edge Functions).
 * This client bypasses RLS — use with caution.
 */
let adminClient: ReturnType<typeof createClient<Database>> | null = null;

export function createAdminClient() {
  if (!adminClient) {
    adminClient = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return adminClient;
}
