import type { SessionProfile } from "@/lib/auth/session";
import { toPatientPayload, type PatientFormValues } from "@/lib/patients/schema";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type PatientRow = Database["public"]["Tables"]["patients"]["Row"];

function requireWorkspace(profile: SessionProfile) {
  if (!profile.workspaceId) {
    throw new Error("Seu perfil não está vinculado a um ambiente.");
  }

  return profile.workspaceId;
}

export async function createPatient(
  profile: SessionProfile,
  values: PatientFormValues,
): Promise<PatientRow> {
  const workspaceId = requireWorkspace(profile);
  const payload = toPatientPayload(values);
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("patients")
    .insert({
      ...payload,
      workspace_id: workspaceId,
      professional_id: profile.id,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as PatientRow;
}

export async function updatePatient(
  patientId: string,
  workspaceId: string,
  values: PatientFormValues,
): Promise<PatientRow> {
  const payload = toPatientPayload(values);
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("patients")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", patientId)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as PatientRow;
}

export async function setPatientActive(
  patientId: string,
  workspaceId: string,
  active: boolean,
): Promise<PatientRow> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("patients")
    .update({
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", patientId)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as PatientRow;
}
