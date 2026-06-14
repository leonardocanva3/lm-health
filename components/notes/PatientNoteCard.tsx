import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Card } from "@/components/ui/Card";
import type { PatientNoteWithPatient } from "@/lib/notes/queries";

type PatientNoteCardProps = {
  note: PatientNoteWithPatient;
};

export function PatientNoteCard({ note }: PatientNoteCardProps) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-slate-950">
        {note.title || "Orientacao"}
      </h3>
      <p className="mt-1 text-xs font-medium text-slate-400">
        {format(new Date(note.created_at), "dd 'de' MMMM 'de' yyyy", {
          locale: ptBR,
        })}
      </p>
      <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-700">
        {note.content}
      </p>
    </Card>
  );
}
