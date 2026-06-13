import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

let browserClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseBrowserEnvStatus() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    hasSupabaseAnonKey: Boolean(supabaseAnonKey),
    hasSupabaseUrl: Boolean(supabaseUrl),
    isProduction: process.env.NODE_ENV === "production",
    nodeEnv: process.env.NODE_ENV,
    supabaseUrlHost: getUrlHost(supabaseUrl),
  };
}

function getUrlHost(value: string | undefined) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).host;
  } catch {
    return "invalid-url";
  }
}

function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[auth] Missing Supabase browser env", getSupabaseBrowserEnvStatus());

    const message =
      process.env.NODE_ENV === "development"
        ? "Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no .env.local para usar o Supabase Auth."
        : "Supabase Auth não está configurado.";

    throw new Error(message);
  }

  return { supabaseAnonKey, supabaseUrl };
}

export function createBrowserSupabaseClient() {
  if (browserClient) {
    return browserClient;
  }

  const { supabaseAnonKey, supabaseUrl } = getSupabaseEnv();

  browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  });

  return browserClient;
}
