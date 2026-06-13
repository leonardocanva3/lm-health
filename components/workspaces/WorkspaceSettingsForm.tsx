"use client";

import type { ChangeEvent, CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  getWorkspaceInitials,
  type WorkspaceIdentity,
} from "@/lib/workspaces/queries";
import {
  workspaceSettingsSchema,
  type WorkspaceSettingsValues,
} from "@/lib/workspaces/schema";
import {
  uploadWorkspaceLogo,
  validateWorkspaceLogoFile,
} from "@/lib/workspaces/storage";

type WorkspaceSettingsFormProps = {
  profileWorkspaceId?: string;
  isSubmitting?: boolean;
  onSubmit: (values: WorkspaceSettingsValues) => Promise<void>;
  workspace: WorkspaceIdentity;
};

type FieldConfig = {
  autoComplete?: string;
  help?: string;
  label: string;
  name: keyof WorkspaceSettingsValues;
  placeholder: string;
  type?: string;
};

const commercialFields: FieldConfig[] = [
  {
    autoComplete: "organization-title",
    label: "Especialidade",
    name: "specialty",
    placeholder: "Ex: Nutricionista clinica",
  },
  {
    autoComplete: "tel",
    label: "WhatsApp",
    name: "whatsapp",
    placeholder: "Ex: (11) 99999-9999",
    type: "tel",
  },
  {
    autoComplete: "tel",
    label: "Telefone",
    name: "phone",
    placeholder: "Ex: (11) 3333-3333",
    type: "tel",
  },
  {
    label: "Instagram",
    name: "instagram",
    placeholder: "Ex: @dra.anamartins",
  },
  {
    autoComplete: "url",
    help: "Use uma URL completa, como https://sua-clinica.com.br.",
    label: "Site",
    name: "site",
    placeholder: "https://sua-clinica.com.br",
    type: "url",
  },
  {
    autoComplete: "street-address",
    label: "Endereco",
    name: "address",
    placeholder: "Ex: Av. Paulista, 1000 - sala 1201",
  },
  {
    autoComplete: "address-level2",
    label: "Cidade/UF",
    name: "city_state",
    placeholder: "Ex: Sao Paulo/SP",
  },
  {
    label: "Horario de atendimento",
    name: "business_hours",
    placeholder: "Ex: Segunda a sexta, 8h as 18h",
  },
];

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === "string") {
      return message;
    }
  }

  return "Erro desconhecido.";
}

function getFormDefaults(workspace: WorkspaceIdentity): WorkspaceSettingsValues {
  return {
    address: workspace.address ?? "",
    business_hours: workspace.businessHours ?? "",
    city_state: workspace.cityState ?? "",
    instagram: workspace.instagram ?? "",
    logo_url: workspace.logoUrl ?? "",
    name: workspace.name,
    phone: workspace.phone ?? "",
    primary_color: workspace.primaryColor ?? "#047857",
    secondary_color: workspace.secondaryColor ?? "#0f172a",
    site: workspace.site ?? "",
    slug: workspace.slug ?? "",
    specialty: workspace.specialty ?? "",
    whatsapp: workspace.whatsapp ?? "",
  };
}

export function WorkspaceSettingsForm({
  profileWorkspaceId,
  isSubmitting = false,
  onSubmit,
  workspace,
}: WorkspaceSettingsFormProps) {
  const [logoError, setLogoError] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const {
    formState: { errors },
    control,
    handleSubmit,
    register,
    reset,
    setError,
    setValue,
  } = useForm<WorkspaceSettingsValues>({
    defaultValues: getFormDefaults(workspace),
  });

  const initials = getWorkspaceInitials(workspace.name);
  const previewUrl = logoPreviewUrl ?? workspace.logoUrl;
  const isBusy = isSubmitting || isUploadingLogo;
  const selectedPrimaryColor =
    useWatch({ control, name: "primary_color" }) || "#047857";
  const selectedSecondaryColor =
    useWatch({ control, name: "secondary_color" }) || "#0f172a";
  const selectedSpecialty = useWatch({ control, name: "specialty" });
  const colorPreviewStyle = {
    "--workspace-primary": selectedPrimaryColor,
    "--workspace-secondary": selectedSecondaryColor,
  } as CSSProperties;

  useEffect(() => {
    reset(getFormDefaults(workspace));
  }, [reset, workspace]);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  function handleLogoFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    setLogoError(null);

    if (!file) {
      setLogoFile(null);
      setLogoPreviewUrl(null);
      return;
    }

    try {
      validateWorkspaceLogoFile(file);
    } catch (error) {
      setLogoFile(null);
      setLogoPreviewUrl(null);
      setLogoError(
        error instanceof Error ? error.message : "Nao foi possivel usar esta imagem.",
      );
      event.target.value = "";
      return;
    }

    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setLogoFile(file);
    setLogoPreviewUrl(nextPreviewUrl);
  }

  async function submit(values: WorkspaceSettingsValues) {
    setLogoError(null);
    let valuesToSave = values;

    if (logoFile) {
      setIsUploadingLogo(true);

      try {
        if (profileWorkspaceId && profileWorkspaceId !== workspace.id) {
          throw new Error(
            "Ambiente do formulario nao confere com o ambiente do perfil autenticado.",
          );
        }

        const updatedWorkspace = await uploadWorkspaceLogo(logoFile);
        valuesToSave = {
          ...values,
          logo_url: updatedWorkspace.logo_url ?? "",
        };
        setValue("logo_url", updatedWorkspace.logo_url ?? "");
      } catch (error) {
        const uploadErrorMessage = getErrorMessage(error);

        setLogoError(
          process.env.NODE_ENV === "development"
            ? `Nao foi possivel enviar a logotipo: ${uploadErrorMessage}`
            : "Nao foi possivel enviar a logotipo. Tente novamente.",
        );
        setIsUploadingLogo(false);
        return;
      }
    }

    const parsed = workspaceSettingsSchema.safeParse(valuesToSave);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof WorkspaceSettingsValues | undefined;

        if (field) {
          setError(field, { message: issue.message });
        }
      }

      setIsUploadingLogo(false);
      return;
    }

    try {
      await onSubmit(parsed.data);
      setLogoFile(null);
      setLogoPreviewUrl(null);
    } finally {
      setIsUploadingLogo(false);
    }
  }

  const logoHelpText = useMemo(
    () =>
      "Envie uma imagem PNG ou JPG. Recomendado: fundo transparente e formato horizontal ou quadrado.",
    [],
  );

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-800">
            Identidade visual
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            Marca e dados comerciais
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Essas informacoes aparecem no painel profissional e no portal do
            paciente, deixando a experiencia com a cara da sua clinica.
          </p>
        </div>
        <div
          className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3"
          style={colorPreviewStyle}
        >
          {previewUrl ? (
            // The logo URL is provided by the workspace admin and may use any domain.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              alt={`Logo de ${workspace.name}`}
              className="h-12 w-12 rounded-lg border border-slate-200 bg-white object-cover"
              src={previewUrl}
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg text-sm font-semibold text-white [background:var(--workspace-secondary)]">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">
              {workspace.name}
            </p>
            <p className="truncate text-xs text-slate-500">
              {selectedSpecialty || "Identidade personalizada"}
            </p>
          </div>
        </div>
      </div>

      <form className="mt-8 space-y-8" onSubmit={handleSubmit(submit)}>
        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <span className="text-sm font-medium text-slate-700">
              Logotipo do profissional
            </span>
            <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition-colors hover:border-emerald-300 hover:bg-emerald-50/50">
              <span className="text-sm font-medium text-slate-950">
                Escolher imagem do dispositivo
              </span>
              <span className="mt-1 text-xs leading-5 text-slate-500">
                {logoFile ? logoFile.name : logoHelpText}
              </span>
              <input
                accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                className="sr-only"
                onChange={handleLogoFileChange}
                type="file"
              />
            </label>
            {logoError ? (
              <span className="mt-2 block text-sm text-red-700">{logoError}</span>
            ) : null}
          </div>

          <div className="space-y-5">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Nome do profissional ou clinica
              </span>
              <Input
                autoComplete="organization"
                className="mt-2"
                placeholder="Ex: Dra. Ana Martins"
                {...register("name")}
              />
              {errors.name ? (
                <span className="mt-1 block text-sm text-red-700">
                  {errors.name.message}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                URL da logotipo
              </span>
              <Input
                className="mt-2"
                placeholder="https://exemplo.com/logo.png"
                type="url"
                {...register("logo_url")}
              />
              {errors.logo_url ? (
                <span className="mt-1 block text-sm text-red-700">
                  {errors.logo_url.message}
                </span>
              ) : null}
              <span className="mt-2 block text-xs leading-5 text-slate-500">
                Voce pode colar uma URL manualmente ou enviar uma imagem acima.
              </span>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Link publico do portal
              </span>
              <div className="mt-2 flex overflow-hidden rounded-md border border-slate-200 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100">
                <span className="inline-flex h-11 shrink-0 items-center border-r border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                  /w/
                </span>
                <input
                  className="h-11 min-w-0 flex-1 px-3 text-sm text-slate-950 outline-none placeholder:text-slate-400"
                  placeholder="nome-da-clinica"
                  {...register("slug")}
                />
              </div>
              {errors.slug ? (
                <span className="mt-1 block text-sm text-red-700">
                  {errors.slug.message}
                </span>
              ) : null}
              <span className="mt-2 block text-xs leading-5 text-slate-500">
                Esse sera o link publico do seu portal. Use apenas letras
                minusculas, numeros e hifen.
              </span>
            </label>
          </div>
        </section>

        <section>
          <h3 className="text-base font-semibold text-slate-950">
            Dados comerciais
          </h3>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            {commercialFields.map((field) => (
              <label className="block" key={field.name}>
                <span className="text-sm font-medium text-slate-700">
                  {field.label}
                </span>
                <Input
                  autoComplete={field.autoComplete}
                  className="mt-2"
                  placeholder={field.placeholder}
                  type={field.type ?? "text"}
                  {...register(field.name)}
                />
                {errors[field.name] ? (
                  <span className="mt-1 block text-sm text-red-700">
                    {errors[field.name]?.message}
                  </span>
                ) : null}
                {field.help ? (
                  <span className="mt-2 block text-xs leading-5 text-slate-500">
                    {field.help}
                  </span>
                ) : null}
              </label>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-base font-semibold text-slate-950">
            Cores da marca
          </h3>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Cor principal
              </span>
              <div className="mt-2 flex gap-3">
                <input
                  aria-label="Selecionar cor principal"
                  className="h-11 w-14 shrink-0 rounded-md border border-slate-200 bg-white p-1"
                  type="color"
                  {...register("primary_color")}
                />
                <Input placeholder="#047857" {...register("primary_color")} />
              </div>
              {errors.primary_color ? (
                <span className="mt-1 block text-sm text-red-700">
                  {errors.primary_color.message}
                </span>
              ) : null}
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                Cor secundaria
              </span>
              <div className="mt-2 flex gap-3">
                <input
                  aria-label="Selecionar cor secundaria"
                  className="h-11 w-14 shrink-0 rounded-md border border-slate-200 bg-white p-1"
                  type="color"
                  {...register("secondary_color")}
                />
                <Input placeholder="#0f172a" {...register("secondary_color")} />
              </div>
              {errors.secondary_color ? (
                <span className="mt-1 block text-sm text-red-700">
                  {errors.secondary_color.message}
                </span>
              ) : null}
            </label>
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button disabled={isBusy} type="submit">
            {isUploadingLogo
              ? "Enviando logotipo..."
              : isSubmitting
                ? "Salvando..."
                : "Salvar identidade"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
