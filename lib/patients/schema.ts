import { z } from "zod";

export const patientFormSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome do paciente."),
  email: z
    .string()
    .trim()
    .refine((value) => value === "" || z.string().email().safeParse(value).success, {
      message: "Informe um email válido.",
    }),
  phone: z.string().trim(),
  birth_date: z.string().trim(),
  active: z.boolean(),
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;

export type PatientPayload = {
  name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  active: boolean;
};

export function toPatientPayload(values: PatientFormValues): PatientPayload {
  const parsed = patientFormSchema.parse(values);

  return {
    name: parsed.name,
    email: parsed.email || null,
    phone: parsed.phone || null,
    birth_date: parsed.birth_date || null,
    active: parsed.active,
  };
}
