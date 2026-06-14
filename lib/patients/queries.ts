import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

export type PatientRow = Database["public"]["Tables"]["patients"]["Row"];

const patientSelect =
  "id, workspace_id, profile_id, professional_id, name, email, phone, birth_date, active, public_access_token_hash, public_access_token_created_at, public_access_enabled, created_at, updated_at";

export async function listPatients(workspaceId: string): Promise<PatientRow[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("patients")
    .select(patientSelect)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as PatientRow[];
}

export async function countPatients(workspaceId: string): Promise<number> {
  const supabase = createBrowserSupabaseClient();
  const { count, error } = await supabase
    .from("patients")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function getPatientById(
  workspaceId: string,
  patientId: string,
): Promise<PatientRow | null> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("patients")
    .select(patientSelect)
    .eq("workspace_id", workspaceId)
    .eq("id", patientId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as PatientRow | null;
}

export async function getPatientByProfile(
  workspaceId: string,
  profileId: string,
): Promise<PatientRow | null> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("patients")
    .select(patientSelect)
    .eq("workspace_id", workspaceId)
    .eq("profile_id", profileId)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as PatientRow | null;
}
