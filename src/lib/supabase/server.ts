import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

import type { Database } from "@/types/database";

/**
 * Supabase client for use in Server Components, Server Actions, and Route
 * Handlers. Reads/writes the session via cookies, so RLS policies evaluate
 * against the real signed-in user (auth.uid()) rather than the anon role.
 *
 * NOTE: calling `set`/`remove` from a Server Component (not a Server Action
 * or Route Handler) will throw — Next.js only allows cookie mutation in
 * those contexts. The try/catch below is the standard @supabase/ssr pattern
 * for this: it's safe to ignore there, because `middleware.ts` is what
 * actually refreshes the session cookie on every request.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from a Server Component — safe to ignore, see note above.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Called from a Server Component — safe to ignore, see note above.
          }
        },
      },
    }
  );
}
