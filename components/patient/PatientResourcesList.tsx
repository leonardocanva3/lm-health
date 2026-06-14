import { PatientResourceCard } from "@/components/resources/PatientResourceCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { PatientResourceWithPatient } from "@/lib/resources/queries";

type PatientResourcesListProps = {
  resources: PatientResourceWithPatient[];
};

const resourceGroups = [
  { key: "pdf", title: "PDFs e leituras" },
  { key: "youtube", title: "Videos" },
  { key: "spotify", title: "Spotify" },
  { key: "links", title: "Links uteis" },
  { key: "others", title: "Outros materiais" },
] as const;

export function PatientResourcesList({ resources }: PatientResourcesListProps) {
  if (resources.length === 0) {
    return (
      <EmptyState
        description="Quando materiais, links ou videos forem enviados, voce podera acessa-los por aqui."
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
