import { Card } from "@/components/ui/Card";
import { PatientResourceTypeBadge } from "@/components/resources/PatientResourceTypeBadge";
import type { PatientResourceWithPatient } from "@/lib/resources/queries";

type PatientResourceCardProps = {
  resource: PatientResourceWithPatient;
};

export function PatientResourceCard({ resource }: PatientResourceCardProps) {
  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold text-slate-950">
          {resource.title}
        </h3>
        <PatientResourceTypeBadge type={resource.type} />
      </div>
      {resource.description ? (
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {resource.description}
        </p>
      ) : null}
      {resource.url ? (
        <a
          className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          href={resource.url}
          rel="noopener noreferrer"
          target="_blank"
        >
          Abrir
        </a>
      ) : (
        <p className="mt-5 text-sm text-slate-500">Link nao informado.</p>
      )}
    </Card>
  );
}
