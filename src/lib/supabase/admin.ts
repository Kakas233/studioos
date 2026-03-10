import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import "@/lib/env"; // Validate env vars on first import

/**
 * Supabase admin client with service_role key.
 * ONLY use in server-side code (API routes, Edge Functions).
 * This client bypasses RLS — use with caution.
 */
export function createAdminClient() {
  return createClient<Database>(
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
