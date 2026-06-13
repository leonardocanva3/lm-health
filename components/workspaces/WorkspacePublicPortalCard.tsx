"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  Link2,
  MessageCircle,
} from "lucide-react";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";
import { getWorkspacePublicationStatus } from "@/lib/workspaces/publication-status";
import { getWorkspaceInitials } from "@/lib/workspaces/queries";

type WorkspacePublicPortalCardProps = {
  logo_url: string | null;
  name: string;
  primary_color: string | null;
  secondary_color: string | null;
  slug: string | null;
  specialty: string | null;
  whatsapp: string | null;
};

export function WorkspacePublicPortalCard({
  logo_url,
  name,
  primary_color,
  secondary_color,
  slug,
  specialty,
  whatsapp,
}: WorkspacePublicPortalCardProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const origin = useSyncExternalStore(
    () => () => undefined,
    () => window.location.origin,
    () => "",
  );
  const cleanSlug = slug?.trim() ?? "";
  const isPortalActive = cleanSlug.length > 0;
  const portalPath = isPortalActive ? `/w/${cleanSlug}` : "";
  const portalUrl = isPortalActive
    ? `${origin || "http://localhost:3000"}${portalPath}`
    : "";
  const whatsappShareMessage = portalUrl
    ? `Olá! Este é meu portal de atendimento. Por ele você pode acessar informações, orientações e sua área do paciente: ${portalUrl}`
    : "";
  const whatsappShareUrl = whatsappShareMessage
    ? `https://wa.me/?text=${encodeURIComponent(whatsappShareMessage)}`
    : "";
  const initials = getWorkspaceInitials(name);
  const publicationStatus = getWorkspacePublicationStatus({
    logoUrl: logo_url,
    name,
    primaryColor: primary_color,
    secondaryColor: secondary_color,
    slug,
    specialty,
    whatsapp,
  });
  const isPortalPublished = publicationStatus.isPublished;
  const style = {
    "--workspace-primary": primary_color ?? "#047857",
    "--workspace-secondary": secondary_color ?? "#0f172a",
  } as CSSProperties;

  useEffect(() => {
    if (copyStatus === "idle") {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopyStatus("idle"), 2200);

    return () => window.clearTimeout(timeoutId);
  }, [copyStatus]);

  const copyLabel = useMemo(() => {
    if (copyStatus === "copied") {
      return "Link copiado";
    }

    if (copyStatus === "error") {
      return "Nao foi possivel copiar";
    }

    return "Copiar link";
  }, [copyStatus]);

  async function handleCopyLink() {
    if (!portalUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <Card className="overflow-hidden p-0" style={style}>
      <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-[color:var(--workspace-primary)] ring-1 ring-slate-200">
              <Link2 aria-hidden="true" size={19} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-emerald-800">
                Portal publico
              </p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <h2 className="text-xl font-semibold text-slate-950">
                  Link publico do seu atendimento
                </h2>
                <span
                  className={cn(
                    "inline-flex w-fit shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1",
                    isPortalPublished
                      ? "bg-emerald-50 text-emerald-800 ring-emerald-100"
                      : "bg-amber-50 text-amber-800 ring-amber-100",
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      isPortalPublished ? "bg-emerald-500" : "bg-amber-500",
                    )}
                  />
                  {isPortalPublished ? "Portal publicado" : "Portal incompleto"}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {isPortalPublished
                  ? "Seu portal esta pronto para ser divulgado."
                  : "Complete os itens abaixo para publicar seu portal com aparencia profissional."}
              </p>
            </div>
          </div>

          {isPortalActive ? (
            <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium uppercase text-slate-500">
                Link publico
              </p>
              <p className="mt-1 break-all text-sm font-semibold text-slate-950">
                {portalUrl}
              </p>
            </div>
          ) : (
            <div className="mt-6 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <AlertCircle
                aria-hidden="true"
                className="mt-0.5 shrink-0"
                size={18}
              />
              <p>Defina um slug para ativar seu portal publico.</p>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <a
              aria-disabled={!isPortalActive}
              className={
                isPortalActive
                  ? "inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 [background:var(--workspace-primary)]"
                  : "inline-flex h-11 cursor-not-allowed items-center justify-center gap-2 rounded-md bg-slate-200 px-4 text-sm font-medium text-slate-500"
              }
              href={isPortalActive ? portalPath : undefined}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink aria-hidden="true" size={17} />
              Ver portal publico
            </a>
            <button
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!isPortalActive}
              onClick={handleCopyLink}
              type="button"
            >
              {copyStatus === "copied" ? (
                <Check aria-hidden="true" size={17} />
              ) : (
                <Copy aria-hidden="true" size={17} />
              )}
              {copyLabel}
            </button>
            <a
              aria-disabled={!whatsappShareUrl}
              className={
                whatsappShareUrl
                  ? "inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50"
                  : "inline-flex h-11 cursor-not-allowed items-center justify-center gap-2 rounded-md bg-slate-200 px-4 text-sm font-medium text-slate-500"
              }
              href={whatsappShareUrl || undefined}
              rel="noreferrer"
              target="_blank"
            >
              <MessageCircle aria-hidden="true" size={17} />
              Compartilhar no WhatsApp
            </a>
          </div>

          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase text-slate-500">
              Checklist de publicacao
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {publicationStatus.checklistItems.map((item) => (
                <div
                  className="flex items-center gap-2 text-sm text-slate-700"
                  key={item.label}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                      item.isComplete
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700",
                    )}
                  >
                    {item.isComplete ? (
                      <Check aria-hidden="true" size={13} />
                    ) : (
                      <AlertCircle aria-hidden="true" size={13} />
                    )}
                  </span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 bg-slate-50 p-5 sm:p-6 lg:border-l lg:border-t-0">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div
              className="rounded-lg p-5 text-white [background:var(--workspace-secondary)]"
            >
              <div className="flex items-center gap-3">
                {logo_url ? (
                  // The logo URL is provided by the workspace admin and may use any domain.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={`Logo de ${name}`}
                    className="h-12 w-12 rounded-lg bg-white object-cover ring-1 ring-white/20"
                    src={logo_url}
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/10 text-sm font-semibold text-white ring-1 ring-white/15">
                    {initials}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">{name}</p>
                  <p className="mt-1 truncate text-sm text-white/70">
                    {specialty || "Atendimento personalizado"}
                  </p>
                </div>
              </div>
              <div className="mt-7 h-2 w-24 rounded-full [background:var(--workspace-primary)]" />
              <p className="mt-5 max-w-sm text-sm leading-6 text-white/75">
                Preview do portal publico com sua marca, cores e dados
                comerciais.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
