import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

export type PatientResourceRow =
  Database["public"]["Tables"]["patient_resources"]["Row"];

export type PatientResourceWithPatient = PatientResourceRow & {
  patient_name: string | null;
};

type PatientResourceQueryRow = PatientResourceRow & {
  patients?: { name: string | null } | null;
};

const resourceSelect =
  "id, workspace_id, patient_id, professional_id, type, title, description, url, storage_path, filename, mime_type, emoji, active, created_at, updated_at, patients(name)";

function mapResource(row: PatientResourceQueryRow): PatientResourceWithPatient {
  return {
    ...row,
    patient_name: row.patients?.name ?? null,
  };
}

export async function listPatientResources(
  workspaceId: string,
): Promise<PatientResourceWithPatient[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("patient_resources")
    .select(resourceSelect)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as PatientResourceQueryRow[]).map(mapResource);
}

export async function listLatestPatientResources(
  workspaceId: string,
  limit = 5,
): Promise<PatientResourceWithPatient[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("patient_resources")
    .select(resourceSelect)
    .eq("workspace_id", workspaceId)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as PatientResourceQueryRow[]).map(mapResource);
}

export async function countActivePatientResources(
  workspaceId: string,
): Promise<number> {
  const supabase = createBrowserSupabaseClient();
  const { count, error } = await supabase
    .from("patient_resources")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("active", true);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function listPatientVisibleResources(
  workspaceId: string,
  patientId: string,
): Promise<PatientResourceWithPatient[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("patient_resources")
    .select(resourceSelect)
    .eq("workspace_id", workspaceId)
    .eq("patient_id", patientId)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as PatientResourceQueryRow[]).map(mapResource);
}

export async function listResourcesByPatient(
  workspaceId: string,
  patientId: string,
): Promise<PatientResourceWithPatient[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("patient_resources")
    .select(resourceSelect)
    .eq("workspace_id", workspaceId)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as PatientResourceQueryRow[]).map(mapResource);
}
