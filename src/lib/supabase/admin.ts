import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";
import { requireEnv } from "@/lib/env";

/**
 * Service-role client. Bypasses RLS entirely — use ONLY for operations that
 * genuinely cannot be scoped to a user session, and keep each such
 * operation as narrow as possible.
 *
 * Current uses (see src/server/repositories/invitations.repository.ts):
 *   - Looking up an invitation by its token before the recipient has logged
 *     in, returning display fields only (never full participant/org data).
 *   - Marking an invitation 'viewed' on that same pre-login visit.
 *
 * Every mutation that actually grants access (accepting, linking, joining
 * a chain) happens AFTER login, through the normal session-scoped client in
 * src/lib/supabase/server.ts, so RLS still governs the actual grant of
 * access. This client only ever handles the "show someone what they were
 * invited to" step.
 *
 * `import "server-only"` ensures a build fails loudly if this is ever
 * imported into client-bundled code.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
