import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/types/database";

/**
 * Supabase client for use in Client Components. Reads the public URL/anon
 * key — safe to expose, since RLS (supabase/migrations/0008_*) is what
 * actually enforces access, not this key.
 */
export function createClient() {
  // Next.js only exposes NEXT_PUBLIC_* values to browser bundles when they are
  // referenced statically. Do not replace these with process.env[name].
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !anonKey) {
    throw new Error(
      "Supabase browser configuration is unavailable. Check the Vercel environment variables and redeploy."
    );
  }

  return createBrowserClient<Database>(supabaseUrl, anonKey);
}
