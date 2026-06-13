import type { AppointmentStatus } from "@/lib/appointments/schema";
import { cn } from "@/lib/utils/cn";

type AppointmentStatusBadgeProps = {
  status: AppointmentStatus | string;
};

const labels: Record<AppointmentStatus, string> = {
  scheduled: "Agendada",
  completed: "Realizada",
  canceled: "Cancelada",
  missed: "Faltou",
};

export function AppointmentStatusBadge({ status }: AppointmentStatusBadgeProps) {
  const normalized = status as AppointmentStatus;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1",
        normalized === "scheduled" &&
          "bg-emerald-50 text-emerald-800 ring-emerald-100",
        normalized === "completed" && "bg-blue-50 text-blue-800 ring-blue-100",
        normalized === "canceled" && "bg-slate-100 text-slate-600 ring-slate-200",
        normalized === "missed" && "bg-amber-50 text-amber-800 ring-amber-100",
      )}
    >
      {labels[normalized] ?? "Status"}
    </span>
  );
}
