import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

async function probeSupabase(path: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return false;

  try {
    const response = await fetch(`${url}${path}`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(4_000),
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Deployment-safe readiness check. It verifies configuration and reaches the
 * real Supabase Auth and PostgREST services without querying customer data or
 * exposing project credentials in the response.
 */
export async function GET() {
  const configured = isSupabaseConfigured();
  const [authApi, dataApi] = configured
    ? await Promise.all([
        probeSupabase("/auth/v1/health"),
        probeSupabase("/rest/v1/"),
      ])
    : [false, false];
  const ready = configured && authApi && dataApi;

  return NextResponse.json(
    {
      status: ready ? "ok" : configured ? "degraded" : "configuration_required",
      service: "chainlink-web",
      platform: "vercel",
      checks: {
        application: true,
        configuration: configured,
        authApi,
        dataApi,
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: ready ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
