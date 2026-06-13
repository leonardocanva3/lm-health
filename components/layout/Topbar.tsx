/* eslint-disable @next/next/no-img-element */
import {
  getWorkspaceInitials,
  type WorkspaceIdentity,
} from "@/lib/workspaces/queries";

type TopbarProps = {
  section: "admin" | "paciente";
  workspace?: WorkspaceIdentity | null;
};

export function Topbar({ section, workspace }: TopbarProps) {
  const title =
    section === "admin" ? "Painel profissional" : "Portal do paciente";
  const workspaceName = workspace?.name ?? "Meu Painel";
  const initials = getWorkspaceInitials(workspace?.name);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {title}
          </p>
          <h1 className="truncate text-base font-semibold text-slate-950">
            {title}
          </h1>
        </div>
        <div className="flex min-w-0 items-center gap-3">
          {workspace?.logoUrl ? (
            <img
              alt={`Logo de ${workspaceName}`}
              className="max-h-10 max-w-36 rounded-md object-contain sm:max-w-44"
              src={workspace.logoUrl}
            />
          ) : (
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white [background:var(--workspace-secondary)]">
                {initials}
              </div>
              <p className="max-w-32 truncate text-right text-sm font-semibold text-slate-950 sm:max-w-56">
                {workspaceName}
              </p>
            </div>
          )}
          <div className="hidden min-w-0 text-right sm:block">
            {workspace?.logoUrl ? (
              <>
                <p className="truncate text-sm font-semibold text-slate-950">
                  {workspaceName}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {workspace.specialty ?? title}
                </p>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
