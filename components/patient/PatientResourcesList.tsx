import { PatientResourceCard } from "@/components/resources/PatientResourceCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PatientResourceWithPatient } from "@/lib/resources/queries";

type PatientResourcesListProps = {
  resources: PatientResourceWithPatient[];
};

const resourceGroups = [
  { key: "pdf", title: "PDFs e leituras", emoji: "📚" },
  { key: "youtube", title: "Vídeos", emoji: "🎥" },
  { key: "spotify", title: "Spotify", emoji: "🎧" },
  { key: "links", title: "Links úteis", emoji: "🔗" },
  { key: "others", title: "Outros materiais", emoji: "📎" },
] as const;

export function PatientResourcesList({ resources }: PatientResourcesListProps) {
  if (resources.length === 0) {
    return (
      <EmptyState
        description="Quando materiais, links ou vídeos forem enviados, você poderá acessá-los por aqui."
        emoji="📚"
        title="Nenhum material enviado ainda"
      />
    );
  }

  return (
    <div className="space-y-7">
      {resourceGroups.map((group) => {
        const groupResources = resources.filter((resource) => {
          if (group.key === "links") {
            return resource.type === "document" || resource.type === "other";
          }

          if (group.key === "others") {
            return (
              resource.type === "image" ||
              resource.type === "file" ||
              resource.type === "spreadsheet"
            );
          }

          return resource.type === group.key;
        });

        if (groupResources.length === 0) {
          return null;
        }

        return (
          <section key={group.key}>
            <h3 className="text-sm font-semibold text-slate-700">
              <span className="mr-2">{group.emoji}</span>
              {group.title}
            </h3>
            <div className="mt-3 grid gap-4 lg:grid-cols-2">
              {groupResources.map((resource) => (
                <PatientResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
