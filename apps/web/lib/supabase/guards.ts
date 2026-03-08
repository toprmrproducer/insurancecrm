import { DatabaseSetupError } from "@/lib/errors";

type JwtPayload = {
  role?: string;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const payload = Buffer.from(parts[1], "base64url").toString("utf8");
    return JSON.parse(payload) as JwtPayload;
  } catch {
    return null;
  }
}

export function assertServiceRoleKey(serviceKey: string) {
  const payload = decodeJwtPayload(serviceKey);
  if (payload?.role === "anon") {
    throw new DatabaseSetupError(
      "SUPABASE_SERVICE_KEY is using the anon key instead of the service_role key. Replace it with the real service_role key from Supabase API settings.",
    );
  }
}

export function normalizeSupabaseError(error: unknown): never {
  const message = error instanceof Error ? error.message : "Unexpected Supabase error";

  if (
    message.includes("schema cache") ||
    message.includes("Could not find the table") ||
    message.includes('relation "') ||
    message.includes("does not exist")
  ) {
    throw new DatabaseSetupError(
      "Database schema is not initialized in Supabase. Run the SQL in supabase/migrations/20260307170000_initial_schema.sql in the Supabase SQL editor, then redeploy.",
    );
  }

  throw error instanceof Error ? error : new Error(message);
}

