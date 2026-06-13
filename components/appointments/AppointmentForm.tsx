"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { AppointmentWithPatient } from "@/lib/appointments/queries";
import {
  appointmentFormSchema,
  type AppointmentFormValues,
} from "@/lib/appointments/schema";
import type { PatientRow } from "@/lib/patients/queries";

type AppointmentFormProps = {
  appointment?: AppointmentWithPatient | null;
  onCancelEdit?: () => void;
  onSubmit: (values: AppointmentFormValues) => Promise<void>;
  patients: PatientRow[];
};

function toLocalDate(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function toLocalTime(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(11, 16);
}

function getDefaultValues(
  appointment?: AppointmentWithPatient | null,
): AppointmentFormValues {
  return {
    patient_id: appointment?.patient_id ?? "",
    scheduled_date: toLocalDate(appointment?.scheduled_at ?? null),
    scheduled_time: toLocalTime(appointment?.scheduled_at ?? null),
    notes: appointment?.notes ?? "",
    status:
      appointment?.status === "completed" ||
      appointment?.status === "canceled" ||
      appointment?.status === "missed"
        ? appointment.status
        : "scheduled",
  };
}

export function AppointmentForm({
  appointment,
  onCancelEdit,
  onSubmit,
  patients,
}: AppointmentFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = Boolean(appointment);
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<AppointmentFormValues>({
    defaultValues: getDefaultValues(appointment),
  });

  useEffect(() => {
    reset(getDefaultValues(appointment));
  }, [appointment, reset]);

  async function submit(values: AppointmentFormValues) {
    setFormError(null);
    const parsed = appointmentFormSchema.safeParse(values);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];

        if (
          field === "patient_id" ||
          field === "scheduled_date" ||
          field === "scheduled_time" ||
          field === "notes" ||
          field === "status"
        ) {
          setError(field, { message: issue.message });
        }
      }

      setFormError("Revise os dados da consulta.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(parsed.data);

      if (!isEditing) {
        reset(getDefaultValues(null));
      }
    } catch {
      setFormError("Não foi possível salvar a consulta. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="p-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-950">
          {isEditing ? "Editar consulta" : "Nova consulta"}
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          Escolha um paciente ativo do seu ambiente e defina data, hora e status.
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
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Data</span>
            <Input className="mt-2" type="date" {...register("scheduled_date")} />
            {errors.scheduled_date ? (
              <span className="mt-1 block text-sm text-red-700">
                {errors.scheduled_date.message}
              </span>
            ) : null}
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Hora</span>
            <Input className="mt-2" type="time" {...register("scheduled_time")} />
            {errors.scheduled_time ? (
              <span className="mt-1 block text-sm text-red-700">
                {errors.scheduled_time.message}
              </span>
            ) : null}
          </label>
        </div>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Status</span>
          <select
            className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            {...register("status")}
          >
            <option value="scheduled">Agendada</option>
            <option value="completed">Realizada</option>
            <option value="canceled">Cancelada</option>
            <option value="missed">Faltou</option>
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Observação opcional
          </span>
          <textarea
            className="mt-2 min-h-28 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            placeholder="Notas rápidas sobre a consulta"
            {...register("notes")}
          />
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
                : "Cadastrar consulta"}
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
