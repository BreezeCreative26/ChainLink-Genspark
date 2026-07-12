/**
 * Validates required environment variables at the point they're needed,
 * rather than letting `process.env.X!` pass `undefined` silently into the
 * Supabase SDK, where it fails with an unhelpful low-level error far from
 * the actual cause.
 */
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Check .env.local against .env.example and the Vercel project environment variables.`
    );
  }
  return value;
}

/**
 * Public pages must stay available even if a deployment was created before
 * Supabase variables were added in Vercel. Authenticated features still fail
 * closed, while login/signup can render a useful configuration notice instead
 * of Next.js' opaque server-side exception screen.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
