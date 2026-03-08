import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";
import { assertServiceRoleKey } from "@/lib/supabase/guards";

export function createAdminClient() {
  assertServiceRoleKey(env.supabaseServiceKey);

  return createClient(env.supabaseUrl, env.supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
