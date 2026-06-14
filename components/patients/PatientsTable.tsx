"use client";

import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PatientStatusBadge } from "@/components/patients/PatientStatusBadge";
import type { PatientRow } from "@/lib/patients/queries";

type PatientsTableProps = {
  busyAccessPatientId?: string | null;
  busyPatientId?: string | null;
  onEdit: (patient: PatientRow) => void;
  onSendAccess: (patient: PatientRow) => void;
  onToggleActive: (patient: PatientRow) => void;
  patients: PatientRow[];
};

export function PatientsTable({
  busyAccessPatientId,
  busyPatientId,
  onEdit,
  onSendAccess,
  onToggleActive,
  patients,
}: PatientsTableProps) {
  if (patients.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl">
          👤
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-950">
          Nenhum paciente cadastrado
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          Cadastre o primeiro paciente para começar a organizar atendimentos,
          orientações e recursos neste ambiente.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-xl font-semibold text-slate-950">Pacientes</h2>
        <p className="mt-1 text-sm text-slate-500">
          Lista real do ambiente logado.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase text-slate-500">
              <th className="px-6 py-3 font-medium">Nome</th>
              <th className="px-6 py-3 font-medium">Contato</th>
              <th className="px-6 py-3 font-medium">Nascimento</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {patients.map((patient) => (
              <tr key={patient.id}>
                <td className="px-6 py-5">
                  <p className="text-sm font-semibold text-slate-950">
                    {patient.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Criado em {new Date(patient.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </td>
                <td className="px-6 py-5 text-sm text-slate-600">
                  <p>{patient.email ?? "Email não informado"}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {patient.phone ?? "Telefone não informado"}
                  </p>
                </td>
                <td className="px-6 py-5 text-sm text-slate-600">
                  {patient.birth_date
                    ? new Date(`${patient.birth_date}T00:00:00`).toLocaleDateString("pt-BR")
                    : "Não informado"}
                </td>
                <td className="px-6 py-5">
                  <PatientStatusBadge active={patient.active} />
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-end gap-2">
                    <Link
                      className="inline-flex h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50"
                      href={`/admin/pacientes/${patient.id}`}
                    >
                      Ver
                    </Link>
                    <Button onClick={() => onEdit(patient)} type="button" variant="secondary">
                      Editar
                    </Button>
                    <Button
                      disabled={!patient.email || busyAccessPatientId === patient.id}
                      onClick={() => onSendAccess(patient)}
                      title={
                        patient.email
                          ? "Enviar link mágico para o email do paciente"
                          : "Cadastre um email para enviar acesso"
                      }
                      type="button"
                      variant="secondary"
                    >
                      {busyAccessPatientId === patient.id
                        ? "Enviando..."
                        : "Enviar acesso"}
                    </Button>
                    <Button
                      disabled={busyPatientId === patient.id}
                      onClick={() => onToggleActive(patient)}
                      type="button"
                      variant="ghost"
                    >
                      {patient.active ? "Desativar" : "Ativar"}
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
