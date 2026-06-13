/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/Badge";
import { ROUTES } from "@/lib/constants/routes";
import { cn } from "@/lib/utils/cn";
import {
  getWorkspaceInitials,
  type WorkspaceIdentity,
} from "@/lib/workspaces/queries";

type SidebarProps = {
  section: "admin" | "paciente";
  workspace?: WorkspaceIdentity | null;
};

const adminItems = [
  { href: ROUTES.admin, label: "Dashboard" },
  { href: ROUTES.adminPacientes, label: "Pacientes" },
  { href: ROUTES.adminAgenda, label: "Agenda" },
  { href: ROUTES.adminRecursos, label: "Recursos" },
  { href: ROUTES.adminOrientacoes, label: "Orientacoes" },
  { href: ROUTES.adminConfiguracoes, label: "Configuracoes" },
] as const;

const patientItems = [
  { href: ROUTES.paciente, label: "Proxima consulta" },
  { href: ROUTES.paciente, label: "Orientacoes" },
  { href: ROUTES.paciente, label: "Materiais" },
  { href: ROUTES.paciente, label: "Videos" },
  { href: ROUTES.paciente, label: "Spotify" },
  { href: ROUTES.paciente, label: "Extras" },
] as const;

export function Sidebar({ section, workspace }: SidebarProps) {
  const pathname = usePathname();
  const items = section === "admin" ? adminItems : patientItems;
  const workspaceName = workspace?.name ?? "Meu Painel";
  const initials = getWorkspaceInitials(workspaceName);

  return (
    <aside className="border-b border-slate-200 bg-white/95 backdrop-blur lg:fixed lg:inset-y-0 lg:left-0 lg:w-72 lg:border-b-0 lg:border-r">
      <div className="flex h-full flex-col gap-8 px-4 py-5 sm:px-6 lg:px-5 lg:py-7">
        <div>
          <Link className="block text-lg font-semibold text-slate-950" href={ROUTES.home}>
            {workspace?.logoUrl ? (
              <img
                alt={`Logo de ${workspaceName}`}
                className="max-h-12 max-w-44 object-contain"
                src={workspace.logoUrl}
              />
            ) : (
              <span className="block break-words">{workspaceName}</span>
            )}
          </Link>
          <p className="mt-2 text-sm text-slate-500">
            {section === "admin" ? "Area profissional" : "Area do paciente"}
          </p>
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3">
            {workspace?.logoUrl ? (
              <img
                alt={`Logo de ${workspaceName}`}
                className="h-9 w-9 rounded-lg border border-slate-200 bg-white object-cover"
                src={workspace.logoUrl}
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white [background:var(--workspace-secondary)]">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-950">
                {workspaceName}
              </p>
              <p className="truncate text-xs text-slate-500">
                {workspace?.specialty ?? "Identidade personalizada"}
              </p>
            </div>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {items.map((item) => (
            <Link
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950",
                pathname === item.href &&
                  "text-white hover:text-white [background:var(--workspace-secondary)]",
              )}
              href={item.href}
              key={item.label}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto hidden lg:block">
          <Badge>Ambiente seguro</Badge>
        </div>
      </div>
    </aside>
  );
}
