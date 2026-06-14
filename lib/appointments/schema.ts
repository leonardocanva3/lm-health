import { z } from "zod";

export const APPOINTMENT_STATUSES = [
  "scheduled",
  "completed",
  "canceled",
  "missed",
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const appointmentFormSchema = z.object({
  patient_id: z.string().uuid("Selecione um paciente."),
  scheduled_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data da consulta."),
  scheduled_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Informe a hora no formato HH:mm."),
  notes: z.string().trim(),
  status: z.enum(APPOINTMENT_STATUSES),
});

export type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

export type AppointmentPayload = {
  patient_id: string;
  scheduled_at: string;
  notes: string | null;
  status: AppointmentStatus;
};

export function combineAppointmentDateTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`).toISOString();
}

export function toAppointmentPayload(
  values: AppointmentFormValues,
): AppointmentPayload {
  const parsed = appointmentFormSchema.parse(values);

  return {
    patient_id: parsed.patient_id,
    scheduled_at: combineAppointmentDateTime(
      parsed.scheduled_date,
      parsed.scheduled_time,
    ),
    notes: parsed.notes || null,
    status: parsed.status,
  };
}
