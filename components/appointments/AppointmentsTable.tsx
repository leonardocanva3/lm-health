"use client";

import { format, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";

import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { AppointmentWithPatient } from "@/lib/appointments/queries";
import type { AppointmentStatus } from "@/lib/appointments/schema";

type AppointmentsTableProps = {
  appointments: AppointmentWithPatient[];
  busyAppointmentId?: string | null;
  onEdit: (appointment: AppointmentWithPatient) => void;
  onSetStatus: (appointment: AppointmentWithPatient, status: AppointmentStatus) => void;
};

function getDate(value: string | null) {
  return value ? new Date(value) : null;
}

function formatTime(value: string | null) {
  const date = getDate(value);

  if (!date) {
    return "--:--";
  }

  return format(date, "HH:mm", { locale: ptBR });
}

function formatDayLabel(value: string | null) {
  const date = getDate(value);

  if (!date) {
    return "Data não informada";
  }

  if (isToday(date)) {
    return "Hoje";
  }

  if (isTomorrow(date)) {
    return "Amanhã";
  }

  return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
}

function getDayKey(value: string | null) {
  const date = getDate(value);

  if (!date) {
    return "sem-data";
  }

  return format(date, "yyyy-MM-dd");
}

function groupAppointments(appointments: AppointmentWithPatient[]) {
  return appointments.reduce<Record<string, AppointmentWithPatient[]>>(
    (groups, appointment) => {
      const key = getDayKey(appointment.scheduled_at);
      groups[key] = groups[key] ?? [];
      groups[key].push(appointment);
      return groups;
    },
    {},
  );
}

export function AppointmentsTable({
  appointments,
  busyAppointmentId,
  onEdit,
  onSetStatus,
}: AppointmentsTableProps) {
  if (appointments.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl">
          📅
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-950">
          Nenhuma consulta cadastrada
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          Crie a primeira consulta para começar a organizar sua rotina de
          atendimentos.
        </p>
      </Card>
    );
  }

  const grouped = groupAppointments(appointments);
  const groupKeys = Object.keys(grouped).sort();

  return (
    <Card className="p-0">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-xl font-semibold text-slate-950">
          Lista de atendimentos
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Consultas organizadas por data, sempre filtradas pelo seu ambiente.
        </p>
      </div>
      <div className="divide-y divide-slate-100">
        {groupKeys.map((key) => {
          const dayAppointments = grouped[key];
          const firstAppointment = dayAppointments[0];

          return (
            <section className="px-4 py-5 sm:px-6" key={key}>
              <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="text-base font-semibold capitalize text-slate-950">
                    {formatDayLabel(firstAppointment.scheduled_at)}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {dayAppointments.length} consulta
                    {dayAppointments.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {dayAppointments.map((appointment) => (
                  <article
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    key={appointment.id}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="rounded-full bg-slate-950 px-3 py-1 text-sm font-semibold text-white">
                            {formatTime(appointment.scheduled_at)}
                          </span>
                          <AppointmentStatusBadge status={appointment.status} />
                        </div>
                        <h4 className="mt-3 text-lg font-semibold text-slate-950">
                          {appointment.patient_name ?? "Paciente"}
                        </h4>
                        {appointment.notes ? (
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {appointment.notes}
                          </p>
                        ) : (
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            Sem observação adicionada.
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <Button
                          onClick={() => onEdit(appointment)}
                          type="button"
                          variant="secondary"
                        >
                          Editar
                        </Button>
                        <Button
                          disabled={
                            busyAppointmentId === appointment.id ||
                            appointment.status === "completed"
                          }
                          onClick={() => onSetStatus(appointment, "completed")}
                          type="button"
                          variant="ghost"
                        >
                          Realizada
                        </Button>
                        <Button
                          disabled={
                            busyAppointmentId === appointment.id ||
                            appointment.status === "missed"
                          }
                          onClick={() => onSetStatus(appointment, "missed")}
                          type="button"
                          variant="ghost"
                        >
                          Faltou
                        </Button>
                        <Button
                          disabled={
                            busyAppointmentId === appointment.id ||
                            appointment.status === "canceled"
                          }
                          onClick={() => onSetStatus(appointment, "canceled")}
                          type="button"
                          variant="ghost"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </Card>
  );
}
