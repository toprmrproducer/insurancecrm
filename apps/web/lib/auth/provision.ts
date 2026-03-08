import { createAdminClient } from "@/lib/supabase/admin";

type ProvisionUserInput = {
  userId: string;
  fullName: string;
  agencyName: string;
};

export async function ensureProvisionedUser({ userId, fullName, agencyName }: ProvisionUserInput) {
  const supabase = createAdminClient();

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existingProfile) {
    return;
  }

  const { data: agency, error: agencyError } = await supabase
    .from("agencies")
    .insert({
      name: agencyName,
    })
    .select("id")
    .single();

  if (agencyError || !agency) {
    throw new Error(agencyError?.message ?? "Failed to create agency during sign-up");
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: userId,
    agency_id: agency.id,
    full_name: fullName,
    role: "admin",
  });

  if (profileError) {
    throw new Error(profileError.message);
  }
}

