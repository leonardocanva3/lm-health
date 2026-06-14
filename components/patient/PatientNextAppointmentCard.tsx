import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { AppointmentWithPatient } from "@/lib/appointments/queries";

type PatientNextAppointmentCardProps = {
  appointment: AppointmentWithPatient | null;
};

function formatAppointmentDate(value: string | null) {
  if (!value) {
    return "Data ainda nao informada";
  }

  return format(new Date(value), "EEEE, dd 'de' MMMM 'as' HH:mm", {
    locale: ptBR,
  });
}

export function PatientNextAppointmentCard({
  appointment,
}: PatientNextAppointmentCardProps) {
  if (!appointment) {
    return (
      <EmptyState
        description="Quando uma nova consulta for marcada, ela aparecera aqui com data e horario."
        title="Sem consulta agendada"
      />
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-800">
            Sua proxima consulta
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-950">
            {formatAppointmentDate(appointment.scheduled_at)}
          </h3>
        </div>
        <AppointmentStatusBadge status={appointment.status} />
      </div>
      {appointment.notes ? (
        <p className="mt-4 rounded-xl bg-white/80 px-4 py-3 text-sm leading-6 text-slate-700">
          {appointment.notes}
        </p>
      ) : (
        <p className="mt-4 text-sm leading-6 text-slate-600">
          O profissional ainda nao adicionou observacoes para esta consulta.
        </p>
      )}
    </div>
  );
}
