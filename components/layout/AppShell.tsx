import type { CSSProperties, ReactNode } from "react";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import type { WorkspaceIdentity } from "@/lib/workspaces/queries";

type AppShellProps = {
  children: ReactNode;
  section: "admin" | "paciente";
  workspace?: WorkspaceIdentity | null;
};

export function AppShell({ children, section, workspace }: AppShellProps) {
  const style = {
    "--workspace-primary": workspace?.primaryColor ?? "#047857",
    "--workspace-secondary": workspace?.secondaryColor ?? "#0f172a",
  } as CSSProperties;

  return (
    <div className="min-h-screen bg-slate-50" style={style}>
      <Sidebar section={section} workspace={workspace} />
      <div className="lg:pl-72">
        <Topbar section={section} workspace={workspace} />
        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
