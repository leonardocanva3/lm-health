"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  patientFormSchema,
  type PatientFormValues,
} from "@/lib/patients/schema";
import type { PatientRow } from "@/lib/patients/queries";

type PatientFormProps = {
  patient?: PatientRow | null;
  onCancelEdit?: () => void;
  onSubmit: (values: PatientFormValues) => Promise<void>;
};

function getDefaultValues(patient?: PatientRow | null): PatientFormValues {
  return {
    name: patient?.name ?? "",
    email: patient?.email ?? "",
    phone: patient?.phone ?? "",
    birth_date: patient?.birth_date ?? "",
    active: patient?.active ?? true,
  };
}

export function PatientForm({
  onCancelEdit,
  onSubmit,
  patient,
}: PatientFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(patient);
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<PatientFormValues>({
    defaultValues: getDefaultValues(patient),
  });

  useEffect(() => {
    reset(getDefaultValues(patient));
  }, [patient, reset]);

  async function submit(values: PatientFormValues) {
    setFormError(null);

    const parsed = patientFormSchema.safeParse(values);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (
          field === "name" ||
          field === "email" ||
          field === "phone" ||
          field === "birth_date" ||
          field === "active"
        ) {
          setError(field, { message: issue.message });
        }
      }

      setFormError("Revise os dados do paciente.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(parsed.data);

      if (!isEditing) {
        reset(getDefaultValues(null));
      }
    } catch {
      setFormError("Não foi possível salvar o paciente. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="p-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">
          {isEditing ? "Editar paciente" : "Novo paciente"}
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Dados básicos vinculados ao ambiente do profissional logado.
        </p>
      </div>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit(submit)}>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Nome</span>
          <Input className="mt-2" placeholder="Nome do paciente" {...register("name")} />
          {errors.name ? (
            <span className="mt-1 block text-sm text-red-700">
              {errors.name.message}
            </span>
          ) : null}
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <Input
              className="mt-2"
              placeholder="paciente@email.com"
              type="email"
              {...register("email")}
            />
            {errors.email ? (
              <span className="mt-1 block text-sm text-red-700">
                {errors.email.message}
              </span>
            ) : null}
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Telefone</span>
            <Input className="mt-2" placeholder="(00) 00000-0000" {...register("phone")} />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Data de nascimento
            </span>
            <Input className="mt-2" type="date" {...register("birth_date")} />
          </label>
          <label className="flex items-center gap-3 rounded-md border border-slate-200 px-3 py-3">
            <input
              className="h-4 w-4 rounded border-slate-300 text-emerald-700"
              type="checkbox"
              {...register("active")}
            />
            <span className="text-sm font-medium text-slate-700">Paciente ativo</span>
          </label>
        </div>
        {formError ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {formError}
          </p>
        ) : null}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting
              ? "Salvando..."
              : isEditing
                ? "Salvar alterações"
                : "Cadastrar paciente"}
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
