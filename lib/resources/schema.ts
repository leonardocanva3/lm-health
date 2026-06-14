import { z } from "zod";

export const RESOURCE_TYPES = [
  "pdf",
  "youtube",
  "spotify",
  "image",
  "file",
  "spreadsheet",
  "document",
  "other",
] as const;

export type PatientResourceType = (typeof RESOURCE_TYPES)[number];

export const patientResourceFormSchema = z.object({
  patient_id: z.string().uuid("Selecione um paciente."),
  type: z.enum(RESOURCE_TYPES),
  title: z.string().trim().min(2, "Informe um título para o recurso."),
  description: z.string().trim(),
  url: z
    .string()
    .trim()
    .refine((value) => value === "" || z.string().url().safeParse(value).success, {
      message: "Informe uma URL válida.",
    }),
  active: z.boolean(),
});

export type PatientResourceFormValues = z.infer<typeof patientResourceFormSchema>;

export type PatientResourcePayload = {
  patient_id: string;
  type: PatientResourceType;
  title: string;
  description: string | null;
  url: string | null;
  active: boolean;
};

export function toPatientResourcePayload(
  values: PatientResourceFormValues,
): PatientResourcePayload {
  const parsed = patientResourceFormSchema.parse(values);

  return {
    patient_id: parsed.patient_id,
    type: parsed.type,
    title: parsed.title,
    description: parsed.description || null,
    url: parsed.url || null,
    active: parsed.active,
  };
}
