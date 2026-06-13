import { NextResponse } from "next/server";

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

export function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const diagnostics = {
    hasSupabaseAnonKey: Boolean(supabaseAnonKey),
    hasSupabaseUrl: Boolean(supabaseUrl),
    isProduction: process.env.NODE_ENV === "production",
    nodeEnv: process.env.NODE_ENV,
    supabaseUrlHost: getUrlHost(supabaseUrl),
  };

  console.info("[auth] Server auth diagnostics", diagnostics);

  return NextResponse.json(diagnostics);
}
