import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function createSupabaseAdminClient() {
  if (!supabaseUrl) {
    throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL no .env.local.");
  }

  if (!supabaseServiceRoleKey) {
    throw new Error("Configure SUPABASE_SERVICE_ROLE_KEY no .env.local.");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
