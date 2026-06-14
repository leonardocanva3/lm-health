import { connection } from "next/server";
import type { CSSProperties } from "react";

import { PatientDashboardCard } from "@/components/patient/PatientDashboardCard";
import { PatientNextAppointmentCard } from "@/components/patient/PatientNextAppointmentCard";
import { PatientNotesList } from "@/components/patient/PatientNotesList";
import { PatientResourcesList } from "@/components/patient/PatientResourcesList";
import { EmptyState } from "@/components/ui/EmptyState";
import { getPublicPatientAccessData } from "@/lib/patient-access/public";
import { getWorkspaceInitials } from "@/lib/workspaces/queries";

type PublicPatientAccessPageProps = {
  params: Promise<{ token: string }>;
};

function PublicAccessUnavailable() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <EmptyState
          description="Este link nao esta disponivel. Fale com a profissional para receber um novo acesso."
          title="Acesso indisponivel"
        />
      </div>
    </main>
  );
}

export default async function PublicPatientAccessPage({
  params,
}: PublicPatientAccessPageProps) {
  await connection();

  const { token } = await params;
  const data = await getPublicPatientAccessData(token);

  if (!data) {
    return <PublicAccessUnavailable />;
  }

  const hasSharedContent =
    Boolean(data.nextAppointment) ||
    data.notes.length > 0 ||
    data.resources.length > 0;
  const workspaceName = data.workspace?.name ?? "sua profissional";
  const initials = getWorkspaceInitials(data.workspace?.name);
  const style = {
    "--workspace-primary": data.workspace?.primaryColor ?? "#047857",
    "--workspace-secondary": data.workspace?.secondaryColor ?? "#0f172a",
  } as CSSProperties;

  return (
    <main className="min-h-screen bg-slate-50" style={style}>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Area do Paciente
            </p>
            <h1 className="truncate text-lg font-semibold text-slate-950">
              {workspaceName}
            </h1>
          </div>
          <div className="flex min-w-0 items-center gap-3">
            {data.workspace?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={`Logo de ${workspaceName}`}
                className="max-h-11 max-w-40 rounded-md object-contain"
                src={data.workspace.logoUrl}
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold text-white [background:var(--workspace-secondary)]">
                {initials}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-7 shadow-sm sm:px-8">
          <p className="text-sm font-medium text-emerald-800">
            {data.workspace?.specialty ?? "Portal do paciente"}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
            Area do Paciente
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Ola, {data.patient.name}. Aqui ficam suas consultas, orientacoes e
            materiais compartilhados por {workspaceName}.
          </p>
        </section>

        {!hasSharedContent ? (
          <EmptyState
            description="Seu espaco ja esta disponivel. As orientacoes e materiais aparecerao aqui assim que forem compartilhados pela profissional."
            title="Seu espaco esta pronto"
          />
        ) : (
          <>
            <PatientDashboardCard
              description="Este e o proximo horario confirmado para o seu acompanhamento."
              eyebrow="Proximo passo"
              title="Proxima consulta"
            >
              <PatientNextAppointmentCard appointment={data.nextAppointment} />
            </PatientDashboardCard>

            <PatientDashboardCard
              description="Mensagens e recomendacoes enviadas especialmente para voce."
              eyebrow="Cuidado continuo"
              title="Orientacoes"
            >
              <PatientNotesList notes={data.notes} />
            </PatientDashboardCard>

            <PatientDashboardCard
              description="Links, PDFs, videos e outros conteudos compartilhados para apoiar seu acompanhamento."
              eyebrow="Materiais"
              title="Materiais"
            >
              <PatientResourcesList resources={data.resources} />
            </PatientDashboardCard>
          </>
        )}
      </div>
    </main>
  );
}
