import { NextResponse } from "next/server";

import { env, hasSupabaseAuthEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeSupabaseError } from "@/lib/supabase/guards";

const requiredTables = ["agencies", "profiles", "leads", "calls", "sip_configurations", "appointments"];

export async function GET() {
  const checks: Record<string, string> = {};

  if (!hasSupabaseAuthEnv()) {
    return NextResponse.json(
      {
        ok: false,
        checks: {
          auth_env: "missing",
        },
      },
      { status: 503 },
    );
  }

  try {
    const supabase = createAdminClient();

    for (const table of requiredTables) {
      const { error } = await supabase.from(table).select("*", { head: true, count: "exact" });
      if (error) {
        normalizeSupabaseError(error);
      }
      checks[table] = "ok";
    }

    checks.supabase_url = env.supabaseUrl ? "ok" : "missing";

    return NextResponse.json({ ok: true, checks });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected error",
        checks,
      },
      { status: 503 },
    );
  }
}
