import { z } from "zod";

export const patientNoteFormSchema = z.object({
  patient_id: z.string().uuid("Selecione um paciente."),
  title: z.string().trim().min(2, "Informe um título para a orientação."),
  content: z.string().trim().min(5, "Escreva a orientação do paciente."),
  emoji: z.string().trim().min(1, "Informe um emoji."),
  active: z.boolean(),
});

export type PatientNoteFormValues = z.infer<typeof patientNoteFormSchema>;

export type PatientNotePayload = {
  patient_id: string;
  title: string;
  content: string;
  emoji: string;
  active: boolean;
};

export function toPatientNotePayload(
  values: PatientNoteFormValues,
): PatientNotePayload {
  const parsed = patientNoteFormSchema.parse(values);

  return {
    patient_id: parsed.patient_id,
    title: parsed.title,
    content: parsed.content,
    emoji: parsed.emoji,
    active: parsed.active,
  };
}
