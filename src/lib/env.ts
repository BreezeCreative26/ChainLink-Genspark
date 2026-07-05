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
      `Missing required environment variable: ${name}. Check .env.local against .env.example.`
    );
  }
  return value;
}
