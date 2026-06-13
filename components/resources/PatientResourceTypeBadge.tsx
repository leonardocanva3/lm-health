import type { PatientResourceType } from "@/lib/resources/schema";

type PatientResourceTypeBadgeProps = {
  type: PatientResourceType | string;
};

const labels: Record<PatientResourceType, string> = {
  pdf: "PDF",
  youtube: "YouTube",
  spotify: "Spotify",
  image: "Imagem",
  file: "Arquivo",
  spreadsheet: "Planilha",
  document: "Documento",
  other: "Outro",
};

export function PatientResourceTypeBadge({ type }: PatientResourceTypeBadgeProps) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
      {labels[type as PatientResourceType] ?? "Recurso"}
    </span>
  );
}
