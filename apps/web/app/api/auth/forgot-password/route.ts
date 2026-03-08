import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { env, hasSupabaseAuthEnv } from "@/lib/env";

const requestSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  if (!hasSupabaseAuthEnv()) {
    return NextResponse.json({ error: "Supabase auth is not configured on this deployment." }, { status: 503 });
  }

  try {
    const payload = requestSchema.parse(await request.json());
    const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { error } = await supabase.auth.resetPasswordForEmail(payload.email, {
      redirectTo: `${env.appUrl}/auth/confirm?next=/reset-password`,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Password reset email sent. Check your inbox for the Supabase reset link.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues.map((issue) => issue.message).join(", ") },
        { status: 422 },
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 },
    );
  }
}

