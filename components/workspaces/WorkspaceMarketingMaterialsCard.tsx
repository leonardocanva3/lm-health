"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AlertCircle, AtSign, CalendarClock, Check, Copy, FileText } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";

type WorkspaceMarketingMaterialsCardProps = {
  name: string;
  slug: string | null;
  specialty: string | null;
};

type MarketingMaterial = {
  description: string;
  icon: typeof FileText;
  id: "instagram-bio" | "patient-invite" | "appointment-reminder";
  title: string;
  tones: Record<MarketingTone, string>;
};

type EditedMaterials = Partial<Record<MarketingMaterial["id"], string>>;
type MarketingTone = "professional" | "warm" | "direct";
type SelectedTones = Partial<Record<MarketingMaterial["id"], MarketingTone>>;

const toneOptions: Array<{ id: MarketingTone; label: string }> = [
  { id: "professional", label: "Profissional" },
  { id: "warm", label: "Acolhedor" },
  { id: "direct", label: "Direto" },
];

export function WorkspaceMarketingMaterialsCard({
  name,
  slug,
  specialty,
}: WorkspaceMarketingMaterialsCardProps) {
  const [copiedId, setCopiedId] = useState<MarketingMaterial["id"] | null>(null);
  const [editedMaterials, setEditedMaterials] = useState<EditedMaterials>({});
  const [selectedTones, setSelectedTones] = useState<SelectedTones>({});
  const origin = useSyncExternalStore(
    () => () => undefined,
    () => window.location.origin,
    () => "",
  );
  const cleanSlug = slug?.trim() ?? "";
  const portalUrl = cleanSlug
    ? `${origin || "http://localhost:3000"}/w/${cleanSlug}`
    : "";
  const specialtyText = specialty?.trim() || "saude e bem-estar";
  const professionalName = name.trim() || "seu profissional";
  const materials = useMemo<MarketingMaterial[]>(
    () => [
      {
        description: "Texto curto para colar na bio do perfil.",
        icon: AtSign,
        id: "instagram-bio",
        title: "Bio do Instagram",
        tones: {
          direct: portalUrl
            ? `Portal de atendimento, orientacoes e area do paciente: ${portalUrl}`
            : "Configure o slug do portal publico para gerar seu link de divulgacao.",
          professional: portalUrl
            ? `Atendimento em ${specialtyText}. Acesse meu portal para informacoes, orientacoes e area do paciente: ${portalUrl}`
            : "Configure o slug do portal publico para gerar seu link de divulgacao.",
          warm: portalUrl
            ? `Um espaco pensado para facilitar seu cuidado. Acesse meu portal com informacoes, orientacoes e area do paciente: ${portalUrl}`
            : "Configure o slug do portal publico para gerar seu link de divulgacao.",
        },
      },
      {
        description: "Mensagem pronta para enviar pelo WhatsApp.",
        icon: FileText,
        id: "patient-invite",
        title: "Convite para paciente",
        tones: {
          direct: portalUrl
            ? `Ola! Acesse seu portal de atendimento por este link: ${portalUrl}`
            : "Configure o slug do portal publico para gerar a mensagem de convite.",
          professional: portalUrl
            ? `Ola! Este e o portal de atendimento da(o) ${professionalName}. Por ele voce pode acessar informacoes importantes, orientacoes e sua area do paciente: ${portalUrl}`
            : "Configure o slug do portal publico para gerar a mensagem de convite.",
          warm: portalUrl
            ? `Ola! Preparei este portal para facilitar seu acompanhamento. Nele voce encontra informacoes, orientacoes e acesso a sua area do paciente: ${portalUrl}`
            : "Configure o slug do portal publico para gerar a mensagem de convite.",
        },
      },
      {
        description: "Modelo para reforcar o acesso antes do atendimento.",
        icon: CalendarClock,
        id: "appointment-reminder",
        title: "Lembrete de consulta",
        tones: {
          direct: portalUrl
            ? `Ola! Lembrete do seu atendimento. Acesse orientacoes e informacoes pelo portal: ${portalUrl}`
            : "Configure o slug do portal publico para gerar o lembrete de consulta.",
          professional: portalUrl
            ? `Ola! Passando para lembrar do seu atendimento. Caso precise acessar orientacoes ou informacoes importantes, utilize sua area do paciente pelo portal: ${portalUrl}`
            : "Configure o slug do portal publico para gerar o lembrete de consulta.",
          warm: portalUrl
            ? `Ola! Este e um lembrete do seu atendimento. Para facilitar seu cuidado, voce pode acessar orientacoes e informacoes importantes pelo portal: ${portalUrl}`
            : "Configure o slug do portal publico para gerar o lembrete de consulta.",
        },
      },
    ],
    [portalUrl, professionalName, specialtyText],
  );

  useEffect(() => {
    if (!copiedId) {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopiedId(null), 2200);

    return () => window.clearTimeout(timeoutId);
  }, [copiedId]);

  function getMaterialValue(material: MarketingMaterial) {
    return editedMaterials[material.id] ?? material.tones.professional;
  }

  function handleMaterialChange(id: MarketingMaterial["id"], value: string) {
    setEditedMaterials((current) => ({
      ...current,
      [id]: value,
    }));
  }

  function handleToneChange(material: MarketingMaterial, tone: MarketingTone) {
    setSelectedTones((current) => ({
      ...current,
      [material.id]: tone,
    }));
    setEditedMaterials((current) => ({
      ...current,
      [material.id]: material.tones[tone],
    }));
  }

  function handleRestoreDefault(material: MarketingMaterial) {
    setSelectedTones((current) => ({
      ...current,
      [material.id]: "professional",
    }));
    setEditedMaterials((current) => {
      const next = { ...current };
      delete next[material.id];
      return next;
    });
  }

  async function handleCopyText(material: MarketingMaterial) {
    if (!portalUrl) {
      return;
    }

    await navigator.clipboard.writeText(getMaterialValue(material));
    setCopiedId(material.id);
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-800">
            Materiais de divulgacao
          </p>
          <h2 className="mt-2 text-xl font-semibold text-slate-950">
            Textos prontos para compartilhar seu portal
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Use estes modelos em redes sociais, WhatsApp e lembretes para
            orientar pacientes com uma comunicacao profissional.
          </p>
        </div>
      </div>

      {!portalUrl ? (
        <div className="mt-6 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
          <p>Defina um slug para ativar os textos com o link do portal publico.</p>
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {materials.map((material) => {
          const Icon = material.icon;
          const isCopied = copiedId === material.id;
          const materialValue = getMaterialValue(material);
          const selectedTone = selectedTones[material.id] ?? "professional";

          return (
            <article
              className="flex min-h-full flex-col rounded-lg border border-slate-200 bg-slate-50 p-4"
              key={material.id}
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[color:var(--workspace-primary)] ring-1 ring-slate-200">
                  <Icon aria-hidden="true" size={18} />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-950">
                    {material.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {material.description}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {toneOptions.map((tone) => (
                  <button
                    className={cn(
                      "inline-flex h-9 items-center justify-center rounded-md border px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                      selectedTone === tone.id
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                    )}
                    disabled={!portalUrl}
                    key={tone.id}
                    onClick={() => handleToneChange(material, tone.id)}
                    type="button"
                  >
                    {tone.label}
                  </button>
                ))}
              </div>

              <textarea
                className="mt-4 min-h-40 flex-1 resize-y rounded-md border border-slate-200 bg-white px-3 py-3 text-sm leading-6 text-slate-700 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                disabled={!portalUrl}
                onChange={(event) =>
                  handleMaterialChange(material.id, event.target.value)
                }
                value={materialValue}
              />

              <div className="mt-4 flex flex-col gap-2 sm:flex-row lg:flex-col 2xl:flex-row">
                <button
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!portalUrl}
                  onClick={() => handleCopyText(material)}
                  type="button"
                >
                  {isCopied ? (
                    <Check aria-hidden="true" size={17} />
                  ) : (
                    <Copy aria-hidden="true" size={17} />
                  )}
                  {isCopied ? "Texto copiado!" : "Copiar texto"}
                </button>
                <button
                  className="inline-flex h-11 items-center justify-center rounded-md px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={
                    !portalUrl ||
                    (selectedTone === "professional" &&
                      editedMaterials[material.id] === undefined)
                  }
                  onClick={() => handleRestoreDefault(material)}
                  type="button"
                >
                  Restaurar padrao
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </Card>
  );
}
