import { createClient } from "@supabase/supabase-js";
import { getServiceRoleKey, getSupabaseEnv } from "./env";

/** Server-only Supabase client. Never import from Client Components. */
export function createAdminClient() {
  const { url } = getSupabaseEnv();
  return createClient(url, getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
