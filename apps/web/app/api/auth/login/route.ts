import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { env, hasSupabaseAuthEnv } from "@/lib/env";

const requestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
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
    let response = NextResponse.json({ success: true });

    const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieMutation[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.json({ success: true });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
          });
        },
      },
    });

    const { error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    return response;
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

