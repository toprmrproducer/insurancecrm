import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";

type CookieMutation = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};

export async function POST(request: NextRequest) {
  let response = NextResponse.redirect(new URL("/login", request.url));

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieMutation[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.redirect(new URL("/login", request.url));
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
        });
      },
    },
  });

  await supabase.auth.signOut();

  return response;
}
