import { startOfDay, endOfDay } from "date-fns";

import type { AppointmentStatus } from "@/lib/appointments/schema";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

export type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];

export type AppointmentWithPatient = AppointmentRow & {
  patient_name: string | null;
};

type AppointmentQueryRow = AppointmentRow & {
  patients?: { name: string | null } | null;
};

function mapAppointment(row: AppointmentQueryRow): AppointmentWithPatient {
  return {
    ...row,
    status: row.status as AppointmentStatus,
    patient_name: row.patients?.name ?? null,
  };
}

const appointmentSelect =
  "id, workspace_id, patient_id, professional_id, scheduled_at, notes, status, created_at, updated_at, patients(name)";

export async function listAppointments(
  workspaceId: string,
): Promise<AppointmentWithPatient[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(appointmentSelect)
    .eq("workspace_id", workspaceId)
    .order("scheduled_at", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as AppointmentQueryRow[]).map(mapAppointment);
}

export async function listUpcomingAppointments(
  workspaceId: string,
  limit = 5,
): Promise<AppointmentWithPatient[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(appointmentSelect)
    .eq("workspace_id", workspaceId)
    .eq("status", "scheduled")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as AppointmentQueryRow[]).map(mapAppointment);
}

export async function listPatientAppointments(
  workspaceId: string,
  patientId: string,
): Promise<AppointmentWithPatient[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(appointmentSelect)
    .eq("workspace_id", workspaceId)
    .eq("patient_id", patientId)
    .order("scheduled_at", { ascending: true });

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as AppointmentQueryRow[]).map(mapAppointment);
}

export async function getNextPatientAppointment(
  workspaceId: string,
  patientId: string,
): Promise<AppointmentWithPatient | null> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(appointmentSelect)
    .eq("workspace_id", workspaceId)
    .eq("patient_id", patientId)
    .eq("status", "scheduled")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(1);

  if (error) {
    throw error;
  }

  const rows = ((data ?? []) as unknown as AppointmentQueryRow[]).map(mapAppointment);

  return rows[0] ?? null;
}

export async function countAppointmentsToday(workspaceId: string): Promise<number> {
  const supabase = createBrowserSupabaseClient();
  const now = new Date();
  const { count, error } = await supabase
    .from("appointments")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .gte("scheduled_at", startOfDay(now).toISOString())
    .lte("scheduled_at", endOfDay(now).toISOString());

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function listPatientUpcomingAppointments(
  workspaceId: string,
  patientId: string,
  limit = 1,
): Promise<AppointmentWithPatient[]> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(appointmentSelect)
    .eq("workspace_id", workspaceId)
    .eq("patient_id", patientId)
    .eq("status", "scheduled")
    .gte("scheduled_at", new Date().toISOString())
    .order("scheduled_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as AppointmentQueryRow[]).map(mapAppointment);
}
