import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  hashPatientPublicAccessToken,
  type PatientAccessPatient,
} from "@/lib/patient-access/server";
import { mapWorkspaceIdentity, type WorkspaceIdentity } from "@/lib/workspaces/queries";
import type {
  AppointmentRow,
  AppointmentWithPatient,
} from "@/lib/appointments/queries";
import type { PatientNoteWithPatient } from "@/lib/notes/queries";
import type { PatientResourceWithPatient } from "@/lib/resources/queries";
import type { AppointmentStatus } from "@/lib/appointments/schema";
import type { Database } from "@/types/database";

type WorkspaceRow = Database["public"]["Tables"]["workspaces"]["Row"];
type NoteRow = Database["public"]["Tables"]["patient_notes"]["Row"];
type ResourceRow = Database["public"]["Tables"]["patient_resources"]["Row"];

export type PublicPatientAccessData = {
  nextAppointment: AppointmentWithPatient | null;
  notes: PatientNoteWithPatient[];
  patient: Pick<
    PatientAccessPatient,
    "birth_date" | "email" | "id" | "name" | "phone"
  >;
  resources: PatientResourceWithPatient[];
  workspace: WorkspaceIdentity | null;
};

const patientSelect =
  "id, workspace_id, profile_id, professional_id, name, email, phone, birth_date, active, public_access_token_hash, public_access_token_created_at, public_access_enabled, created_at, updated_at";

function mapAppointment(
  row: AppointmentRow,
  patientName: string,
): AppointmentWithPatient {
  return {
    ...row,
    status: row.status as AppointmentStatus,
    patient_name: patientName,
  };
}

function mapNote(row: NoteRow, patientName: string): PatientNoteWithPatient {
  return {
    ...row,
    patient_name: patientName,
  };
}

function mapResource(
  row: ResourceRow,
  patientName: string,
): PatientResourceWithPatient {
  return {
    ...row,
    patient_name: patientName,
  };
}

export async function getPublicPatientAccessData(
  token: string,
): Promise<PublicPatientAccessData | null> {
  const tokenHash = hashPatientPublicAccessToken(token);
  const adminClient = createSupabaseAdminClient();

  const { data: patientData, error: patientError } = await adminClient
    .from("patients")
    .select(patientSelect)
    .eq("public_access_token_hash", tokenHash)
    .eq("public_access_enabled", true)
    .eq("active", true)
    .maybeSingle();

  if (patientError || !patientData?.workspace_id) {
    return null;
  }

  const workspaceId = patientData.workspace_id;
  const patient = {
    ...(patientData as PatientAccessPatient & {
      birth_date: string | null;
    }),
    workspace_id: workspaceId,
  };

  const [workspaceResult, appointmentResult, notesResult, resourcesResult] =
    await Promise.all([
      adminClient
        .from("workspaces")
        .select("*")
        .eq("id", workspaceId)
        .eq("active", true)
        .maybeSingle(),
      adminClient
        .from("appointments")
        .select(
          "id, workspace_id, patient_id, professional_id, scheduled_at, notes, status, created_at, updated_at",
        )
        .eq("workspace_id", workspaceId)
        .eq("patient_id", patient.id)
        .eq("status", "scheduled")
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(1),
      adminClient
        .from("patient_notes")
        .select(
          "id, workspace_id, patient_id, professional_id, title, content, emoji, active, created_at, updated_at",
        )
        .eq("workspace_id", workspaceId)
        .eq("patient_id", patient.id)
        .eq("active", true)
        .order("created_at", { ascending: false }),
      adminClient
        .from("patient_resources")
        .select(
          "id, workspace_id, patient_id, professional_id, type, title, description, url, storage_path, filename, mime_type, emoji, active, created_at, updated_at",
        )
        .eq("workspace_id", workspaceId)
        .eq("patient_id", patient.id)
        .eq("active", true)
        .order("created_at", { ascending: false }),
    ]);

  if (workspaceResult.error || !workspaceResult.data) {
    return null;
  }

  if (appointmentResult.error || notesResult.error || resourcesResult.error) {
    return null;
  }

  const appointmentRows = (appointmentResult.data ?? []) as AppointmentRow[];
  const noteRows = (notesResult.data ?? []) as NoteRow[];
  const resourceRows = (resourcesResult.data ?? []) as ResourceRow[];

  return {
    nextAppointment: appointmentRows[0]
      ? mapAppointment(appointmentRows[0], patient.name)
      : null,
    notes: noteRows.map((row) => mapNote(row, patient.name)),
    patient: {
      birth_date: patient.birth_date,
      email: patient.email,
      id: patient.id,
      name: patient.name,
      phone: patient.phone,
    },
    resources: resourceRows.map((row) => mapResource(row, patient.name)),
    workspace: mapWorkspaceIdentity(workspaceResult.data as WorkspaceRow),
  };
}
