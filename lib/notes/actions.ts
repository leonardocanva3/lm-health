import type { SessionProfile } from "@/lib/auth/session";
import {
  toPatientNotePayload,
  type PatientNoteFormValues,
} from "@/lib/notes/schema";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type PatientNoteRow = Database["public"]["Tables"]["patient_notes"]["Row"];

function requireWorkspace(profile: SessionProfile) {
  if (!profile.workspaceId) {
    throw new Error("Seu perfil não está vinculado a um ambiente.");
  }

  return profile.workspaceId;
}

export async function createPatientNote(
  profile: SessionProfile,
  values: PatientNoteFormValues,
): Promise<PatientNoteRow> {
  const workspaceId = requireWorkspace(profile);
  const payload = toPatientNotePayload(values);
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("patient_notes")
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

  return data as PatientNoteRow;
}

export async function updatePatientNote(
  noteId: string,
  workspaceId: string,
  values: PatientNoteFormValues,
): Promise<PatientNoteRow> {
  const payload = toPatientNotePayload(values);
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("patient_notes")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", noteId)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as PatientNoteRow;
}

export async function setPatientNoteActive(
  noteId: string,
  workspaceId: string,
  active: boolean,
): Promise<PatientNoteRow> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("patient_notes")
    .update({
      active,
      updated_at: new Date().toISOString(),
    })
    .eq("id", noteId)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as PatientNoteRow;
}
