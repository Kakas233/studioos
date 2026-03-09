import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/types";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    // Return a dummy client during build/SSG when env vars are missing.
    // This prevents crashes during static page generation.
    return createBrowserClient<Database>(
      "https://placeholder.supabase.co",
      "placeholder-key"
    );
  }

  client = createBrowserClient<Database>(url, key);
  return client;
}
