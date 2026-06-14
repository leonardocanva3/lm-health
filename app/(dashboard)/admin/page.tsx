"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import { AuthNotice } from "@/components/auth/AuthNotice";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { WorkspacePortalDashboardCard } from "@/components/workspaces/WorkspacePortalDashboardCard";
import {
  countAppointmentsToday,
  listUpcomingAppointments,
  type AppointmentWithPatient,
} from "@/lib/appointments/queries";
import { isAdmin } from "@/lib/auth/roles";
import {
  getCurrentSession,
  getCurrentSessionProfile,
  signOut,
} from "@/lib/auth/session";
import type { SessionProfile } from "@/lib/auth/session";
import {
  countActivePatientNotes,
  listLatestPatientNotes,
  type PatientNoteWithPatient,
} from "@/lib/notes/queries";
import { countPatients } from "@/lib/patients/queries";
import {
  countActivePatientResources,
  listLatestPatientResources,
  type PatientResourceWithPatient,
} from "@/lib/resources/queries";
import {
  getWorkspaceById,
  type WorkspaceIdentity,
} from "@/lib/workspaces/queries";
import { ROUTES } from "@/lib/constants/routes";

function formatAppointmentDate(value: string | null) {
  if (!value) {
    return "Data não informada";
  }

  return format(new Date(value), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
}

export default function AdminPage() {
  const router = useRouter();
  const [activeNotes, setActiveNotes] = useState<number | null>(null);
  const [activeResources, setActiveResources] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [latestNotes, setLatestNotes] = useState<PatientNoteWithPatient[]>([]);
  const [latestResources, setLatestResources] = useState<
    PatientResourceWithPatient[]
  >([]);
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<number | null>(null);
  const [totalPatients, setTotalPatients] = useState<number | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<
    AppointmentWithPatient[]
  >([]);
  const [workspace, setWorkspace] = useState<WorkspaceIdentity | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const session = await getCurrentSession();

        if (!isMounted) {
          return;
        }

        setHasSession(Boolean(session));

        if (!session) {
          router.replace(ROUTES.entrar);
          return;
        }

        const currentProfile = await getCurrentSessionProfile();

        if (isMounted) {
          setProfile(currentProfile);
        }

        if (currentProfile?.workspaceId && isAdmin(currentProfile.role)) {
          const [
            countToday,
            upcoming,
            notesCount,
            notes,
            resourcesCount,
            resources,
            patientsCount,
            workspaceData,
          ] = await Promise.all([
            countAppointmentsToday(currentProfile.workspaceId),
            listUpcomingAppointments(currentProfile.workspaceId, 5),
            countActivePatientNotes(currentProfile.workspaceId),
            listLatestPatientNotes(currentProfile.workspaceId, 3),
            countActivePatientResources(currentProfile.workspaceId),
            listLatestPatientResources(currentProfile.workspaceId, 3),
            countPatients(currentProfile.workspaceId),
            getWorkspaceById(currentProfile.workspaceId),
          ]);

          if (isMounted) {
            setTodayAppointments(countToday);
            setUpcomingAppointments(upcoming);
            setActiveNotes(notesCount);
            setLatestNotes(notes);
            setActiveResources(resourcesCount);
            setLatestResources(resources);
            setTotalPatients(patientsCount);
            setWorkspace(workspaceData);
          }
        }
      } catch {
        if (isMounted) {
          setErrorMessage("Não foi possível carregar os dados do painel.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleSignOut() {
    await signOut();
    setHasSession(false);
    setProfile(null);
    setWorkspace(null);
  }

  if (isLoading) {
    return (
      <AppShell section="admin">
        <AuthNotice
          actionHref=""
          description="Estamos verificando sua sessão com segurança."
          title="Carregando acesso"
        />
      </AppShell>
    );
  }

  if (!hasSession) {
    return (
      <AppShell section="admin">
        <AuthNotice
          description="Entre com uma conta profissional para acessar o painel."
          title="Sessão ausente"
        />
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell section="admin">
        <AuthNotice
          actionHref=""
          description="Perfil não encontrado. Fale com o administrador."
          title="Acesso pendente"
        />
      </AppShell>
    );
  }

  if (!isAdmin(profile.role)) {
    return (
      <AppShell section="admin">
        <AuthNotice
          actionHref=""
          description="Este painel é restrito a owners e admins."
          title="Acesso restrito"
        />
      </AppShell>
    );
  }

  const workspaceName = workspace?.name ?? profile.name;
  const workspaceDescriptor =
    workspace?.specialty ?? "Operacao clinica personalizada";
  const workspaceContact = [workspace?.cityState, workspace?.whatsapp]
    .filter(Boolean)
    .join(" | ");

  const stats = [
    {
      label: "Atendimentos hoje",
      value: todayAppointments === null ? "—" : String(todayAppointments),
      detail: "Consultas registradas para hoje",
    },
    {
      label: "Total de pacientes",
      value: totalPatients === null ? "—" : String(totalPatients),
      detail: "Pacientes cadastrados no ambiente",
    },
    {
      label: "Recursos enviados",
      value: activeResources === null ? "—" : String(activeResources),
      detail: "Recursos ativos para pacientes",
    },
    {
      label: "Últimas orientações",
      value: activeNotes === null ? "—" : String(activeNotes),
      detail: "Orientações ativas para pacientes",
    },
  ];

  const activities = [
    ...latestResources.map(
      (resource) =>
        `${resource.title} para ${
          resource.patient_name ?? "paciente"
        }`,
    ),
    ...latestNotes.map(
      (note) =>
        `${note.title || "Orientação"} para ${
          note.patient_name ?? "paciente"
        }`,
    ),
  ].slice(0, 5);

  return (
    <AppShell section="admin" workspace={workspace}>
      <div className="space-y-10">
        <section className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white px-6 py-7 shadow-sm sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge>Dashboard</Badge>
            <h1 className="mt-5 text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
              {workspaceName}
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              {workspaceDescriptor}. Acompanhe pacientes, agenda, recursos e
              orientacoes em uma experiencia personalizada para sua marca.
            </p>
            {workspaceContact ? (
              <p className="mt-3 text-sm font-medium text-slate-500">
                {workspaceContact}
              </p>
            ) : null}
            <p className="mt-4 text-sm text-slate-500">
              Logado como {profile.name} ({profile.role}).
            </p>
          </div>
          <Button onClick={handleSignOut} variant="secondary">
            Sair
          </Button>
        </section>

        {errorMessage ? (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMessage}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card className="p-6" key={stat.label}>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <div className="mt-5 flex items-end justify-between gap-4">
                <span className="text-4xl font-semibold tracking-normal text-slate-950">
                  {stat.value}
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-500">{stat.detail}</p>
            </Card>
          ))}
        </section>

        <WorkspacePortalDashboardCard workspace={workspace} />

        <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <Card className="overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  Próximos atendimentos
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Consultas futuras com status agendada.
                </p>
              </div>
              <Badge className="bg-slate-50 text-slate-700 ring-slate-200">
                Agenda
              </Badge>
            </div>
            {upcomingAppointments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/70 text-xs uppercase text-slate-500">
                      <th className="px-6 py-3 font-medium">Paciente</th>
                      <th className="px-6 py-3 font-medium">Data</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {upcomingAppointments.map((appointment) => (
                      <tr key={appointment.id}>
                        <td className="px-6 py-5 text-sm font-medium text-slate-950">
                          {appointment.patient_name ?? "Paciente"}
                        </td>
                        <td className="px-6 py-5 text-sm text-slate-600">
                          {formatAppointmentDate(appointment.scheduled_at)}
                        </td>
                        <td className="px-6 py-5">
                          <AppointmentStatusBadge status={appointment.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-10 text-center">
                <p className="text-sm font-medium text-slate-950">
                  Nenhuma consulta futura
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Os próximos atendimentos aparecerão aqui quando forem
                  cadastrados na agenda.
                </p>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-slate-950">
              Atividades recentes
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Recursos e orientações recentes.
            </p>
            <div className="mt-6 space-y-5">
              {activities.length > 0 ? (
                activities.map((activity) => (
                  <div className="flex gap-4" key={activity}>
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-slate-300" />
                    <p className="text-sm leading-6 text-slate-600">{activity}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-slate-600">
                  Nenhum recurso ou orientação registrado ainda.
                </p>
              )}
            </div>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
