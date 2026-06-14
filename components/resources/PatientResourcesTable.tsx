"use client";

import { PatientResourceStatusBadge } from "@/components/resources/PatientResourceStatusBadge";
import { PatientResourceTypeBadge } from "@/components/resources/PatientResourceTypeBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PatientResourceWithPatient } from "@/lib/resources/queries";

type PatientResourcesTableProps = {
  busyResourceId?: string | null;
  onEdit: (resource: PatientResourceWithPatient) => void;
  onToggleActive: (resource: PatientResourceWithPatient) => void;
  resources: PatientResourceWithPatient[];
};

export function PatientResourcesTable({
  busyResourceId,
  onEdit,
  onToggleActive,
  resources,
}: PatientResourcesTableProps) {
  if (resources.length === 0) {
    return (
      <Card className="p-8 text-center">
        <h2 className="text-lg font-semibold text-slate-950">
          Nenhum recurso cadastrado
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          Adicione o primeiro link, video, PDF por URL ou material para um paciente.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-xl font-semibold text-slate-950">Recursos</h2>
        <p className="mt-1 text-sm text-slate-500">
          Materiais vinculados ao ambiente logado.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase text-slate-500">
              <th className="px-6 py-3 font-medium">Recurso</th>
              <th className="px-6 py-3 font-medium">Paciente</th>
              <th className="px-6 py-3 font-medium">Tipo</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 text-right font-medium">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {resources.map((resource) => (
              <tr key={resource.id}>
                <td className="max-w-sm px-6 py-5">
                  <p className="text-sm font-semibold text-slate-950">
                    {resource.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                    {resource.description || resource.url || "Sem descricao"}
                  </p>
                </td>
                <td className="px-6 py-5 text-sm text-slate-600">
                  {resource.patient_name ?? "Paciente"}
                </td>
                <td className="px-6 py-5">
                  <PatientResourceTypeBadge type={resource.type} />
                </td>
                <td className="px-6 py-5">
                  <PatientResourceStatusBadge active={resource.active} />
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-end gap-2">
                    <Button
                      onClick={() => onEdit(resource)}
                      type="button"
                      variant="secondary"
                    >
                      Editar
                    </Button>
                    <Button
                      disabled={busyResourceId === resource.id}
                      onClick={() => onToggleActive(resource)}
                      type="button"
                      variant="ghost"
                    >
                      {resource.active ? "Desativar" : "Ativar"}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
