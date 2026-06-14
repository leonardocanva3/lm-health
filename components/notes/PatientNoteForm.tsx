"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  patientNoteFormSchema,
  type PatientNoteFormValues,
} from "@/lib/notes/schema";
import type { PatientNoteWithPatient } from "@/lib/notes/queries";
import type { PatientRow } from "@/lib/patients/queries";

type PatientNoteFormProps = {
  note?: PatientNoteWithPatient | null;
  onCancelEdit?: () => void;
  onSubmit: (values: PatientNoteFormValues) => Promise<void>;
  patients: PatientRow[];
};

function getDefaultValues(note?: PatientNoteWithPatient | null): PatientNoteFormValues {
  return {
    patient_id: note?.patient_id ?? "",
    title: note?.title ?? "",
    content: note?.content ?? "",
    active: note?.active ?? true,
  };
}

export function PatientNoteForm({
  note,
  onCancelEdit,
  onSubmit,
  patients,
}: PatientNoteFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(note);
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<PatientNoteFormValues>({
    defaultValues: getDefaultValues(note),
  });

  useEffect(() => {
    reset(getDefaultValues(note));
  }, [note, reset]);

  async function submit(values: PatientNoteFormValues) {
    setFormError(null);
    const parsed = patientNoteFormSchema.safeParse(values);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (
          field === "patient_id" ||
          field === "title" ||
          field === "content" ||
          field === "active"
        ) {
          setError(field, { message: issue.message });
        }
      }

      setFormError("Revise os dados da orientacao.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(parsed.data);

      if (!isEditing) {
        reset(getDefaultValues(null));
      }
    } catch {
      setFormError("Nao foi possivel salvar a orientacao. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="p-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">
          {isEditing ? "Editar orientacao" : "Nova orientacao"}
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Escreva uma orientacao personalizada para um paciente ativo.
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
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Titulo</span>
          <Input
            className="mt-2"
            placeholder="Orientacao para a semana"
            {...register("title")}
          />
          {errors.title ? (
            <span className="mt-1 block text-sm text-red-700">
              {errors.title.message}
            </span>
          ) : null}
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Conteudo</span>
          <textarea
            className="mt-2 min-h-40 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            placeholder="Escreva a orientacao personalizada..."
            {...register("content")}
          />
          {errors.content ? (
            <span className="mt-1 block text-sm text-red-700">
              {errors.content.message}
            </span>
          ) : null}
        </label>
        <label className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-3">
          <input
            className="h-4 w-4 rounded border-slate-300 text-emerald-700"
            type="checkbox"
            {...register("active")}
          />
          <span className="text-sm font-medium text-slate-700">
            Orientacao ativa para o paciente
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
                ? "Salvar alteracoes"
                : "Criar orientacao"}
          </Button>
          {isEditing ? (
            <Button onClick={onCancelEdit} type="button" variant="secondary">
              Cancelar edicao
            </Button>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
