import type { Session, User } from "@supabase/supabase-js";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { UserRole } from "@/lib/auth/roles";

export type SessionProfile = {
  id: string;
  workspaceId: string | null;
  name: string;
  email: string;
  role: UserRole;
};

export async function getCurrentSession(): Promise<Session | null> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return data.user;
}

export async function signIn(email: string, password: string) {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  const supabase = createBrowserSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getCurrentSessionProfile(): Promise<SessionProfile | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, workspace_id, name, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const profile = data as {
    id: string;
    workspace_id: string | null;
    name: string;
    email: string;
    role: UserRole;
  } | null;

  if (!profile) {
    return null;
  }

  return {
    id: profile.id,
    workspaceId: profile.workspace_id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
  };
}
