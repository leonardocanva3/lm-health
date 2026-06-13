import { cn } from "@/lib/utils/cn";

type PatientStatusBadgeProps = {
  active: boolean;
};

export function PatientStatusBadge({ active }: PatientStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ring-1",
        active
          ? "bg-emerald-50 text-emerald-800 ring-emerald-100"
          : "bg-slate-100 text-slate-600 ring-slate-200",
      )}
    >
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}
