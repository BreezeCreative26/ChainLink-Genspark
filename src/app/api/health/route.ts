import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export function GET() {
  const configured = isSupabaseConfigured();

  return NextResponse.json(
    {
      status: configured ? "ok" : "configuration_required",
      service: "chainlink-web",
      platform: "vercel",
      checks: {
        application: true,
        supabase: configured,
      },
      timestamp: new Date().toISOString(),
    },
    { status: configured ? 200 : 503 }
  );
}
