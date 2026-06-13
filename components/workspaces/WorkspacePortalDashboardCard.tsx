"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Link2,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";
import { getWorkspacePublicationStatus } from "@/lib/workspaces/publication-status";
import type { WorkspaceIdentity } from "@/lib/workspaces/queries";

type WorkspacePortalDashboardCardProps = {
  workspace: WorkspaceIdentity | null;
};

export function WorkspacePortalDashboardCard({
  workspace,
}: WorkspacePortalDashboardCardProps) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const origin = useSyncExternalStore(
    () => () => undefined,
    () => window.location.origin,
    () => "",
  );
  const publicationStatus = getWorkspacePublicationStatus({
    logoUrl: workspace?.logoUrl,
    name: workspace?.name,
    primaryColor: workspace?.primaryColor,
    secondaryColor: workspace?.secondaryColor,
    slug: workspace?.slug,
    specialty: workspace?.specialty,
    whatsapp: workspace?.whatsapp,
  });
  const cleanSlug = workspace?.slug?.trim() ?? "";
  const portalPath = cleanSlug ? `/w/${cleanSlug}` : "";
  const portalUrl = portalPath
    ? `${origin || "http://localhost:3000"}${portalPath}`
    : "";
  const whatsappShareMessage = portalUrl
    ? `Olá! Este é meu portal de atendimento. Por ele você pode acessar informações, orientações e sua área do paciente: ${portalUrl}`
    : "";
  const whatsappShareUrl = whatsappShareMessage
    ? `https://wa.me/?text=${encodeURIComponent(whatsappShareMessage)}`
    : "";
  const isPortalPublished = publicationStatus.isPublished;
  const missingItems = publicationStatus.checklistItems.filter(
    (item) => !item.isComplete,
  );
  const copyLabel = useMemo(() => {
    if (copyStatus === "copied") {
      return "Link copiado!";
    }

    if (copyStatus === "error") {
      return "Nao foi possivel copiar";
    }

    return "Copiar link";
  }, [copyStatus]);

  useEffect(() => {
    if (copyStatus === "idle") {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopyStatus("idle"), 2200);

    return () => window.clearTimeout(timeoutId);
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
    <Card className="p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
            <Link2 aria-hidden="true" size={17} />
            Portal publico
          </div>
          <h2 className="mt-3 text-xl font-semibold text-slate-950">
            Status de divulgacao
          </h2>
        </div>
        <Badge
          className={cn(
            "w-fit",
            isPortalPublished
              ? "bg-emerald-50 text-emerald-800 ring-emerald-100"
              : "bg-amber-50 text-amber-800 ring-amber-100",
          )}
        >
          {isPortalPublished ? "Portal publicado" : "Portal incompleto"}
        </Badge>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">
        {isPortalPublished
          ? "Seu portal esta pronto para ser divulgado."
          : "Complete os itens principais para divulgar seu portal com mais seguranca."}
      </p>

      {portalPath ? (
        <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-medium uppercase text-slate-500">
            Link publico
          </p>
          <p className="mt-1 break-all text-sm font-semibold text-slate-950">
            {portalUrl}
          </p>
        </div>
      ) : (
        <div className="mt-5 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <AlertCircle aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
          <p>Defina um slug nas configuracoes para ativar o link publico.</p>
        </div>
      )}

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        {publicationStatus.checklistItems.map((item) => (
          <div
            className="flex items-center gap-2 text-sm text-slate-700"
            key={item.id}
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

      {!isPortalPublished && missingItems.length > 0 ? (
        <p className="mt-4 text-xs leading-5 text-slate-500">
          {publicationStatus.completedCount}/{publicationStatus.totalCount} itens
          completos.
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <a
          aria-disabled={!portalPath}
          className={
            portalPath
              ? "inline-flex h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 [background:var(--workspace-primary)]"
              : "inline-flex h-11 cursor-not-allowed items-center justify-center gap-2 rounded-md bg-slate-200 px-4 text-sm font-medium text-slate-500"
          }
          href={portalPath || undefined}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink aria-hidden="true" size={17} />
          Ver portal
        </a>
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!portalUrl}
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
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50"
          href={ROUTES.adminConfiguracoes}
        >
          Configurar portal
          <ArrowRight aria-hidden="true" size={17} />
        </Link>
      </div>
    </Card>
  );
}
