import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";
import { requireEnv } from "@/lib/env";

/**
 * Supabase client for use in Client Components. Reads the public URL/anon
 * key — safe to expose, since RLS (supabase/migrations/0008_*) is what
 * actually enforces access, not this key.
 */
export function createClient() {
  return createBrowserClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  );
}
