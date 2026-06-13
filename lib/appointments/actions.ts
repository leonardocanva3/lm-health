import type { SessionProfile } from "@/lib/auth/session";
import {
  toAppointmentPayload,
  type AppointmentFormValues,
  type AppointmentStatus,
} from "@/lib/appointments/schema";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];

function requireWorkspace(profile: SessionProfile) {
  if (!profile.workspaceId) {
    throw new Error("Seu perfil não está vinculado a um ambiente.");
  }

  return profile.workspaceId;
}

export async function createAppointment(
  profile: SessionProfile,
  values: AppointmentFormValues,
): Promise<AppointmentRow> {
  const workspaceId = requireWorkspace(profile);
  const payload = toAppointmentPayload(values);
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("appointments")
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

  return data as AppointmentRow;
}

export async function updateAppointment(
  appointmentId: string,
  workspaceId: string,
  values: AppointmentFormValues,
): Promise<AppointmentRow> {
  const payload = toAppointmentPayload(values);
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("appointments")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", appointmentId)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as AppointmentRow;
}

export async function setAppointmentStatus(
  appointmentId: string,
  workspaceId: string,
  status: AppointmentStatus,
): Promise<AppointmentRow> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("appointments")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", appointmentId)
    .eq("workspace_id", workspaceId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as AppointmentRow;
}
