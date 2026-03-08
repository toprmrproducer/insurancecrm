function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function hasEnv(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

function getFirstEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) {
      return value;
    }
  }

  return undefined;
}

export function hasSupabasePublicEnv() {
  return hasEnv("NEXT_PUBLIC_SUPABASE_URL") && hasEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function hasSupabaseAuthEnv() {
  return Boolean(getFirstEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL")) &&
    Boolean(getFirstEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_KEY"));
}

export function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true" && !hasSupabaseAuthEnv();
}

export function hasLivekitEnv() {
  return hasEnv("LIVEKIT_URL") && hasEnv("LIVEKIT_API_KEY") && hasEnv("LIVEKIT_API_SECRET");
}

export const env = {
  get supabaseUrl() {
    return getFirstEnv("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL") ?? requireEnv("SUPABASE_URL");
  },
  get supabaseAnonKey() {
    return (
      getFirstEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_KEY") ??
      requireEnv("SUPABASE_ANON_KEY")
    );
  },
  get supabaseServiceKey() {
    return requireEnv("SUPABASE_SERVICE_KEY");
  },
  get livekitUrl() {
    return requireEnv("LIVEKIT_URL");
  },
  get livekitApiKey() {
    return requireEnv("LIVEKIT_API_KEY");
  },
  get livekitApiSecret() {
    return requireEnv("LIVEKIT_API_SECRET");
  },
  get appUrl() {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  },
  get cronSecret() {
    return process.env.CRON_SECRET ?? "";
  },
};
