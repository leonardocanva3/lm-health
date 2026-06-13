import { PatientNoteCard } from "@/components/notes/PatientNoteCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PatientNoteWithPatient } from "@/lib/notes/queries";

type PatientNotesListProps = {
  notes: PatientNoteWithPatient[];
};

export function PatientNotesList({ notes }: PatientNotesListProps) {
  if (notes.length === 0) {
    return (
      <EmptyState
        description="Quando o profissional enviar uma orientação para você, ela ficará disponível aqui."
        emoji="📝"
        title="Nenhuma orientação por enquanto"
      />
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {notes.map((note) => (
        <PatientNoteCard key={note.id} note={note} />
      ))}
    </div>
  );
}
