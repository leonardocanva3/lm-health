import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

export type PatientNoteRow = Database["public"]["Tables"]["patient_notes"]["Row"];

export type PatientNoteWithPatient = PatientNoteRow & {
  patient_name: string | null;
};

type PatientNoteQueryRow = PatientNoteRow & {
  patients?: { name: string | null } | null;
};

const noteSelect =
  "id, workspace_id, patient_id, professional_id, title, content, active, created_at, updated_at, patients(name)";

function mapNote(row: PatientNoteQueryRow): PatientNoteWithPatient {
  return {
    ...row,
    patient_name: row.patients?.name ?? null,
  };
}

export async function listPatientNotes(
  workspaceId: string,
): Promise<PatientNoteWithPatient[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("patient_notes")
    .select(noteSelect)
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as PatientNoteQueryRow[]).map(mapNote);
}

export async function listLatestPatientNotes(
  workspaceId: string,
  limit = 5,
): Promise<PatientNoteWithPatient[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("patient_notes")
    .select(noteSelect)
    .eq("workspace_id", workspaceId)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as PatientNoteQueryRow[]).map(mapNote);
}

export async function countActivePatientNotes(workspaceId: string): Promise<number> {
  const supabase = createBrowserSupabaseClient();
  const { count, error } = await supabase
    .from("patient_notes")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("active", true);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function listPatientVisibleNotes(
  workspaceId: string,
  patientId: string,
): Promise<PatientNoteWithPatient[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("patient_notes")
    .select(noteSelect)
    .eq("workspace_id", workspaceId)
    .eq("patient_id", patientId)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as PatientNoteQueryRow[]).map(mapNote);
}

export async function listNotesByPatient(
  workspaceId: string,
  patientId: string,
): Promise<PatientNoteWithPatient[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("patient_notes")
    .select(noteSelect)
    .eq("workspace_id", workspaceId)
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as PatientNoteQueryRow[]).map(mapNote);
}
