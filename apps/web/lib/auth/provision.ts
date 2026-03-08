import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeSupabaseError } from "@/lib/supabase/guards";

type ProvisionUserInput = {
  userId: string;
  fullName: string;
  agencyName: string;
};

export async function ensureProvisionedUser({ userId, fullName, agencyName }: ProvisionUserInput) {
  try {
    const supabase = createAdminClient();

    const { data: existingProfile, error: existingProfileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (existingProfileError) {
      normalizeSupabaseError(existingProfileError);
    }

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
      normalizeSupabaseError(agencyError ?? new Error("Failed to create agency during sign-up"));
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      agency_id: agency.id,
      full_name: fullName,
      role: "admin",
    });

    if (profileError) {
      normalizeSupabaseError(profileError);
    }
  } catch (error) {
    normalizeSupabaseError(error);
  }
}
