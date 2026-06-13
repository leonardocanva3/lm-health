"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  patientResourceFormSchema,
  RESOURCE_TYPES,
  type PatientResourceFormValues,
} from "@/lib/resources/schema";
import type { PatientResourceWithPatient } from "@/lib/resources/queries";
import type { PatientRow } from "@/lib/patients/queries";

type PatientResourceFormProps = {
  onCancelEdit?: () => void;
  onSubmit: (values: PatientResourceFormValues) => Promise<void>;
  patients: PatientRow[];
  resource?: PatientResourceWithPatient | null;
};

const typeLabels = {
  pdf: "PDF",
  youtube: "YouTube",
  spotify: "Spotify",
  image: "Imagem",
  file: "Arquivo",
  spreadsheet: "Planilha",
  document: "Documento",
  other: "Outro",
};

function getDefaultValues(
  resource?: PatientResourceWithPatient | null,
): PatientResourceFormValues {
  return {
    patient_id: resource?.patient_id ?? "",
    type: resource?.type ?? "other",
    title: resource?.title ?? "",
    description: resource?.description ?? "",
    url: resource?.url ?? "",
    emoji: resource?.emoji ?? "🔗",
    active: resource?.active ?? true,
  };
}

export function PatientResourceForm({
  onCancelEdit,
  onSubmit,
  patients,
  resource,
}: PatientResourceFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(resource);
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<PatientResourceFormValues>({
    defaultValues: getDefaultValues(resource),
  });

  useEffect(() => {
    reset(getDefaultValues(resource));
  }, [resource, reset]);

  async function submit(values: PatientResourceFormValues) {
    setFormError(null);
    const parsed = patientResourceFormSchema.safeParse(values);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (
          field === "patient_id" ||
          field === "type" ||
          field === "title" ||
          field === "description" ||
          field === "url" ||
          field === "emoji" ||
          field === "active"
        ) {
          setError(field, { message: issue.message });
        }
      }

      setFormError("Revise os dados do recurso.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(parsed.data);

      if (!isEditing) {
        reset(getDefaultValues(null));
      }
    } catch {
      setFormError("Não foi possível salvar o recurso. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="p-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">
          {isEditing ? "Editar recurso" : "Novo recurso"}
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Adicione links, vídeos, PDFs por URL e outros materiais sem upload.
        </p>
      </div>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit(submit)}>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Paciente</span>
          <select
            className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            {...register("patient_id")}
          >
            <option value="">Selecione um paciente</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))}
          </select>
          {errors.patient_id ? (
            <span className="mt-1 block text-sm text-red-700">
              {errors.patient_id.message}
            </span>
          ) : null}
        </label>
        <div className="grid gap-4 sm:grid-cols-[0.35fr_0.65fr]">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Emoji</span>
            <Input className="mt-2" placeholder="🔗" {...register("emoji")} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Tipo</span>
            <select
              className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              {...register("type")}
            >
              {RESOURCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {typeLabels[type]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Título</span>
          <Input
            className="mt-2"
            placeholder="Nome do recurso"
            {...register("title")}
          />
          {errors.title ? (
            <span className="mt-1 block text-sm text-red-700">
              {errors.title.message}
            </span>
          ) : null}
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">URL</span>
          <Input
            className="mt-2"
            placeholder="https://..."
            type="url"
            {...register("url")}
          />
          {errors.url ? (
            <span className="mt-1 block text-sm text-red-700">
              {errors.url.message}
            </span>
          ) : null}
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Descrição</span>
          <textarea
            className="mt-2 min-h-28 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            placeholder="Como o paciente deve usar este recurso?"
            {...register("description")}
          />
        </label>
        <label className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-3">
          <input
            className="h-4 w-4 rounded border-slate-300 text-emerald-700"
            type="checkbox"
            {...register("active")}
          />
          <span className="text-sm font-medium text-slate-700">
            Recurso ativo para o paciente
          </span>
        </label>
        {formError ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {formError}
          </p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button disabled={isSubmitting || patients.length === 0} type="submit">
            {isSubmitting
              ? "Salvando..."
              : isEditing
                ? "Salvar alterações"
                : "Criar recurso"}
          </Button>
          {isEditing ? (
            <Button onClick={onCancelEdit} type="button" variant="secondary">
              Cancelar edição
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
