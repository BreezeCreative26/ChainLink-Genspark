/**
 * Error-handling boundary for server actions.
 *
 * Problem this fixes: service functions sometimes throw a deliberate,
 * safe-to-show message ("This invitation was sent to a different email
 * address."), but repository functions also let raw Postgrest/Postgres
 * errors propagate (`if (error) throw error`) — which can contain schema
 * details (constraint names, column names) that should never reach a
 * browser. Every server action was previously doing
 * `err instanceof Error ? err.message : fallback`, which shows BOTH kinds
 * of error identically, leaking the raw ones.
 *
 * Fix: only messages explicitly thrown as AppError are ever shown to the
 * client. Anything else — including raw database errors — is logged
 * server-side and replaced with a generic fallback.
 */
export class AppError extends Error {}

export function toActionError(err: unknown, fallback: string): string {
  if (err instanceof AppError) {
    return err.message;
  }

  // Not a deliberate, safe-to-show error — log the real one server-side
  // (visible in server logs / Vercel function logs) and never expose it.
  console.error(err);
  return fallback;
}
