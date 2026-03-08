import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { env, hasSupabaseAuthEnv } from "@/lib/env";
import { DatabaseSetupError } from "@/lib/errors";
import { ensureProvisionedUser } from "@/lib/auth/provision";
import { createAdminClient } from "@/lib/supabase/admin";

const requestSchema = z.object({
  fullName: z.string().min(2),
  agencyName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

type CookieMutation = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function POST(request: NextRequest) {
  if (!hasSupabaseAuthEnv()) {
    return NextResponse.json({ error: "Supabase auth is not configured on this deployment." }, { status: 503 });
  }

  try {
    const payload = requestSchema.parse(await request.json());
    const admin = createAdminClient();
    const { data: createdUserData, error: createUserError } = await admin.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        full_name: payload.fullName,
        agency_name: payload.agencyName,
      },
    });

    if (createUserError || !createdUserData.user) {
      return NextResponse.json(
        { error: createUserError?.message ?? "Unable to create account." },
        { status: 400 },
      );
    }

    try {
      await ensureProvisionedUser({
        userId: createdUserData.user.id,
        fullName: payload.fullName,
        agencyName: payload.agencyName,
      });
    } catch (error) {
      await admin.auth.admin.deleteUser(createdUserData.user.id);
      throw error;
    }

    let response = NextResponse.json({
      success: true,
      requiresEmailConfirmation: false,
      message: "Account created successfully. You can access the dashboard now.",
    });

    const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieMutation[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.json({
            success: true,
            requiresEmailConfirmation: false,
            message: "Account created successfully. You can access the dashboard now.",
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
          });
        },
      },
    });

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (signInError) {
      return NextResponse.json(
        { error: signInError.message || "Account created, but automatic sign-in failed." },
        { status: 400 },
      );
    }

    return response;
  } catch (error) {
    if (error instanceof DatabaseSetupError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

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
