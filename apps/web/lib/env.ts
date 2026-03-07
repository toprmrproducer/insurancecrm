function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true";
}

export const env = {
  get supabaseUrl() {
    return requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  },
  get supabaseAnonKey() {
    return requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
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

