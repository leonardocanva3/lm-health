import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export const USER_ROLES = ["owner", "admin", "patient"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(role: string): role is UserRole {
  return USER_ROLES.includes(role as UserRole);
}

export async function getUserRole(userId?: string): Promise<UserRole | null> {
  const supabase = createBrowserSupabaseClient();
  const targetUserId = userId ?? (await supabase.auth.getUser()).data.user?.id;

  if (!targetUserId) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", targetUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  const profile = data as { role: UserRole } | null;

  return profile?.role ?? null;
}

export function isAdmin(role: UserRole | null | undefined) {
  return role === "owner" || role === "admin";
}

export function isPatient(role: UserRole | null | undefined) {
  return role === "patient";
}
