"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { PatientNoteStatusBadge } from "@/components/notes/PatientNoteStatusBadge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PatientNoteWithPatient } from "@/lib/notes/queries";

type PatientNotesTableProps = {
  busyNoteId?: string | null;
  notes: PatientNoteWithPatient[];
  onEdit: (note: PatientNoteWithPatient) => void;
  onToggleActive: (note: PatientNoteWithPatient) => void;
};

export function PatientNotesTable({
  busyNoteId,
  notes,
  onEdit,
  onToggleActive,
}: PatientNotesTableProps) {
  if (notes.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl">
          💬
        </div>
        <h2 className="mt-4 text-lg font-semibold text-slate-950">
          Nenhuma orientação cadastrada
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          Crie a primeira orientação personalizada para um paciente do ambiente.
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-xl font-semibold text-slate-950">Orientações</h2>
        <p className="mt-1 text-sm text-slate-500">
          Notas personalizadas do ambiente logado.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase text-slate-500">
              <th className="px-6 py-3 font-medium">Orientação</th>
              <th className="px-6 py-3 font-medium">Paciente</th>
              <th className="px-6 py-3 font-medium">Data</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {notes.map((note) => (
              <tr key={note.id}>
                <td className="max-w-sm px-6 py-5">
                  <p className="text-sm font-semibold text-slate-950">
                    <span className="mr-2">{note.emoji || "💬"}</span>
                    {note.title || "Orientação"}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                    {note.content}
                  </p>
                </td>
                <td className="px-6 py-5 text-sm text-slate-600">
                  {note.patient_name ?? "Paciente"}
                </td>
                <td className="px-6 py-5 text-sm text-slate-600">
                  {format(new Date(note.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </td>
                <td className="px-6 py-5">
                  <PatientNoteStatusBadge active={note.active} />
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-end gap-2">
                    <Button onClick={() => onEdit(note)} type="button" variant="secondary">
                      Editar
                    </Button>
                    <Button
                      disabled={busyNoteId === note.id}
                      onClick={() => onToggleActive(note)}
                      type="button"
                      variant="ghost"
                    >
                      {note.active ? "Desativar" : "Ativar"}
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
