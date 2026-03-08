import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { env, hasSupabaseAuthEnv } from "@/lib/env";
import { ensureProvisionedUser } from "@/lib/auth/provision";

const requestSchema = z.object({
  fullName: z.string().min(2),
  agencyName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
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

    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        emailRedirectTo: `${env.appUrl}/auth/confirm?next=/dashboard`,
        data: {
          full_name: payload.fullName,
          agency_name: payload.agencyName,
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data.user?.id) {
      await ensureProvisionedUser({
        userId: data.user.id,
        fullName: payload.fullName,
        agencyName: payload.agencyName,
      });
    }

    return NextResponse.json({
      success: true,
      requiresEmailConfirmation: !data.session,
      message: data.session
        ? "Account created successfully. You can access the dashboard now."
        : "Account created. Check your email to confirm your account before signing in.",
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

