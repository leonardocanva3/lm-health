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
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-2xl">
          {note.emoji || "💬"}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-950">
            {note.title || "Orientação"}
          </h3>
          <p className="mt-1 text-xs font-medium text-slate-400">
            {format(new Date(note.created_at), "dd 'de' MMMM 'de' yyyy", {
              locale: ptBR,
            })}
          </p>
        </div>
      </div>
      <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-700">
        {note.content}
      </p>
    </Card>
  );
}
