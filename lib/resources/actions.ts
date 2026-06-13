import type { SessionProfile } from "@/lib/auth/session";
import {
  toPatientResourcePayload,
  type PatientResourceFormValues,
} from "@/lib/resources/schema";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type PatientResourceRow =
  Database["public"]["Tables"]["patient_resources"]["Row"];

function requireWorkspace(profile: SessionProfile) {
  if (!profile.workspaceId) {
    throw new Error("Seu perfil não está vinculado a um ambiente.");
  }

  return profile.workspaceId;
}

export async function createPatientResource(
  profile: SessionProfile,
  values: PatientResourceFormValues,
): Promise<PatientResourceRow> {
  const workspaceId = requireWorkspace(profile);
  const payload = toPatientResourcePayload(values);
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("patient_resources")
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

  return data as PatientResourceRow;
}

export async function updatePatientResource(
  resourceId: string,
  workspaceId: string,
  values: PatientResourceFormValues,
): Promise<PatientResourceRow> {
  const payload = toPatientResourcePayload(values);
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("patient_resources")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", resourceId)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as PatientResourceRow;
}

export async function setPatientResourceActive(
  resourceId: string,
  workspaceId: string,
  active: boolean,
): Promise<PatientResourceRow> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("patient_resources")
    .update({
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", resourceId)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as PatientResourceRow;
}
