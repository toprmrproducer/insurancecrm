import { NextResponse } from "next/server";

import { isDemoMode } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AgencyContext = {
  userId: string;
  agencyId: string;
  role: "admin" | "agent" | "manager";
};

export async function requireAgencyContext(): Promise<AgencyContext> {
  if (isDemoMode()) {
    return {
      userId: "demo-user",
      agencyId: "demo-agency",
      role: "admin",
    };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("agency_id, role")
    .eq("id", user.id)
    .single();

  if (error || !profile?.agency_id || !profile?.role) {
    throw new Response("Forbidden", { status: 403 });
  }

  return {
    userId: user.id,
    agencyId: profile.agency_id,
    role: profile.role,
  };
}

export function isAdmin(role: AgencyContext["role"]) {
  return role === "admin";
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
