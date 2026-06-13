import { z } from "zod";

const optionalText = z.string().trim();
const optionalUrl = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || z.string().url().safeParse(value).success,
    {
      message: "Informe uma URL valida.",
    },
  );
const optionalHexColor = z
  .string()
  .trim()
  .refine((value) => value === "" || /^#[0-9A-Fa-f]{6}$/.test(value), {
    message: "Informe uma cor no formato #000000.",
  });
const slugSchema = z
  .string()
  .trim()
  .min(2, "Informe o slug do portal publico.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use apenas letras minusculas, numeros e hifen, sem espacos.",
  );

export const workspaceSettingsSchema = z.object({
  address: optionalText,
  business_hours: optionalText,
  city_state: optionalText,
  instagram: optionalText,
  logo_url: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || z.string().url().safeParse(value).success,
      {
        message: "Informe uma URL valida para a logotipo.",
      },
    ),
  name: z.string().trim().min(2, "Informe o nome do profissional ou clinica."),
  phone: optionalText,
  primary_color: optionalHexColor,
  secondary_color: optionalHexColor,
  site: optionalUrl,
  slug: slugSchema,
  specialty: optionalText,
  whatsapp: optionalText,
});

export type WorkspaceSettingsValues = z.infer<typeof workspaceSettingsSchema>;

export function toWorkspaceSettingsPayload(values: WorkspaceSettingsValues) {
  const parsed = workspaceSettingsSchema.parse(values);

  return {
    address: parsed.address || null,
    business_hours: parsed.business_hours || null,
    city_state: parsed.city_state || null,
    instagram: parsed.instagram || null,
    logo_url: parsed.logo_url || null,
    name: parsed.name,
    phone: parsed.phone || null,
    primary_color: parsed.primary_color || null,
    secondary_color: parsed.secondary_color || null,
    site: parsed.site || null,
    slug: parsed.slug,
    specialty: parsed.specialty || null,
    whatsapp: parsed.whatsapp || null,
  };
}
