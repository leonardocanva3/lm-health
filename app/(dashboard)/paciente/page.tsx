"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import { AuthNotice } from "@/components/auth/AuthNotice";
import { AppShell } from "@/components/layout/AppShell";
import { PatientDashboardCard } from "@/components/patient/PatientDashboardCard";
import { PatientNextAppointmentCard } from "@/components/patient/PatientNextAppointmentCard";
import { PatientNotesList } from "@/components/patient/PatientNotesList";
import { PatientResourcesList } from "@/components/patient/PatientResourcesList";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  getNextPatientAppointment,
  listPatientUpcomingAppointments,
  type AppointmentWithPatient,
} from "@/lib/appointments/queries";
import { isPatient } from "@/lib/auth/roles";
import {
  getCurrentSession,
  getCurrentSessionProfile,
  signOut,
  type SessionProfile,
} from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import {
  listPatientVisibleNotes,
  type PatientNoteWithPatient,
} from "@/lib/notes/queries";
import { getPatientByProfile, type PatientRow } from "@/lib/patients/queries";
import {
  listPatientVisibleResources,
  type PatientResourceWithPatient,
} from "@/lib/resources/queries";
import {
  getWorkspaceById,
  getWorkspaceInitials,
  type WorkspaceIdentity,
} from "@/lib/workspaces/queries";

function formatAppointmentDate(value: string | null) {
  if (!value) {
    return "Data ainda não informada";
  }

  return format(new Date(value), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
}

function formatBirthDate(value: string | null) {
  if (!value) {
    return "Não informado";
  }

  return format(new Date(`${value}T00:00:00`), "dd/MM/yyyy", { locale: ptBR });
}

export default function PacientePage() {
  const router = useRouter();
  const [futureAppointments, setFutureAppointments] = useState<
    AppointmentWithPatient[]
  >([]);
  const [hasSession, setHasSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nextAppointment, setNextAppointment] =
    useState<AppointmentWithPatient | null>(null);
  const [notes, setNotes] = useState<PatientNoteWithPatient[]>([]);
  const [patient, setPatient] = useState<PatientRow | null>(null);
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const [resources, setResources] = useState<PatientResourceWithPatient[]>([]);
  const [workspace, setWorkspace] = useState<WorkspaceIdentity | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadAuthState() {
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

        if (!currentProfile?.workspaceId || !isPatient(currentProfile.role)) {
          return;
        }

        const [patientRow, workspaceData] = await Promise.all([
          getPatientByProfile(currentProfile.workspaceId, currentProfile.id),
          getWorkspaceById(currentProfile.workspaceId),
        ]);

        if (!isMounted) {
          return;
        }

        setWorkspace(workspaceData);

        if (!patientRow) {
          return;
        }

        const [appointment, appointments, visibleNotes, visibleResources] =
          await Promise.all([
            getNextPatientAppointment(currentProfile.workspaceId, patientRow.id),
            listPatientUpcomingAppointments(
              currentProfile.workspaceId,
              patientRow.id,
              6,
            ),
            listPatientVisibleNotes(currentProfile.workspaceId, patientRow.id),
            listPatientVisibleResources(currentProfile.workspaceId, patientRow.id),
          ]);

        if (isMounted) {
          setPatient(patientRow);
          setNextAppointment(appointment);
          setFutureAppointments(appointments);
          setNotes(visibleNotes);
          setResources(visibleResources);
        }
      } catch {
        if (isMounted) {
          setLoadError("Não foi possível carregar seu painel agora.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadAuthState();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleSignOut() {
    await signOut();
    setHasSession(false);
    setProfile(null);
    setPatient(null);
    setNextAppointment(null);
    setFutureAppointments([]);
    setNotes([]);
    setResources([]);
    setWorkspace(null);
  }

  if (isLoading) {
    return (
      <AppShell section="paciente" workspace={workspace}>
        <AuthNotice
          actionHref=""
          description="Estamos preparando seu painel com segurança."
          title="Carregando seu acesso"
        />
      </AppShell>
    );
  }

  if (!hasSession) {
    return (
      <AppShell section="paciente" workspace={workspace}>
        <AuthNotice
          description="Entre com sua conta para ver suas consultas e materiais."
          title="Sessão ausente"
        />
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell section="paciente" workspace={workspace}>
        <AuthNotice
          actionHref=""
          description="Seu perfil ainda não está pronto. Fale com o profissional responsável."
          title="Acesso pendente"
        />
      </AppShell>
    );
  }

  if (!isPatient(profile.role)) {
    return (
      <AppShell section="paciente" workspace={workspace}>
        <AuthNotice
          actionHref=""
          description="Você não tem permissão para acessar esta área."
          title="Acesso restrito"
        />
      </AppShell>
    );
  }

  if (loadError) {
    return (
      <AppShell section="paciente" workspace={workspace}>
        <AuthNotice actionHref="" description={loadError} title="Algo não abriu bem" />
      </AppShell>
    );
  }

  if (!patient) {
    return (
      <AppShell section="paciente" workspace={workspace}>
        <AuthNotice
          actionHref=""
          description="Não encontramos seu cadastro de paciente. Fale com o profissional para vincular seu acesso."
          title="Paciente não encontrado"
        />
      </AppShell>
    );
  }

  const workspaceName = workspace?.name ?? "seu profissional";
  const initials = getWorkspaceInitials(workspace?.name);

  return (
    <AppShell section="paciente" workspace={workspace}>
      <div className="space-y-8">
        <section className="rounded-2xl border border-slate-200 bg-white px-6 py-7 shadow-sm sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                {workspace?.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={`Logo de ${workspaceName}`}
                    className="h-8 w-8 rounded-full border border-slate-200 bg-white object-cover"
                    src={workspace.logoUrl}
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white [background:var(--workspace-secondary)]">
                    {initials}
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    {workspace?.specialty ?? "Portal do paciente"}
                  </p>
                  <p className="text-sm font-semibold text-slate-950">
                    {workspaceName}
                  </p>
                </div>
              </div>
              <h1 className="mt-6 text-3xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
                Olá, {patient.name}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Aqui ficam suas consultas, orientações e materiais enviados pelo
                profissional. Tudo em um lugar simples, seguro e fácil de
                acompanhar.
              </p>
            </div>
            <Button onClick={handleSignOut} variant="secondary">
              Sair
            </Button>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
          <PatientDashboardCard
            description="Este é o próximo horário confirmado para o seu acompanhamento."
            eyebrow="Próximo passo"
            title="Próxima consulta"
          >
            <PatientNextAppointmentCard appointment={nextAppointment} />
          </PatientDashboardCard>

          <PatientDashboardCard
            description="Confira se seus dados principais estão corretos."
            eyebrow="Seu cadastro"
            title="Dados básicos"
          >
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="text-slate-500">Nome</dt>
                <dd className="mt-1 font-medium text-slate-950">{patient.name}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Email</dt>
                <dd className="mt-1 font-medium text-slate-950">
                  {patient.email ?? "Não informado"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Telefone</dt>
                <dd className="mt-1 font-medium text-slate-950">
                  {patient.phone ?? "Não informado"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Nascimento</dt>
                <dd className="mt-1 font-medium text-slate-950">
                  {formatBirthDate(patient.birth_date)}
                </dd>
              </div>
            </dl>
          </PatientDashboardCard>
        </section>

        <PatientDashboardCard
          description="Veja os próximos horários já marcados para você."
          eyebrow="Agenda"
          title="Consultas futuras"
        >
          {futureAppointments.length > 0 ? (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {futureAppointments.map((appointment) => (
                <div
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  key={appointment.id}
                >
                  <div>
                    <p className="font-medium text-slate-950">
                      {formatAppointmentDate(appointment.scheduled_at)}
                    </p>
                    {appointment.notes ? (
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        {appointment.notes}
                      </p>
                    ) : null}
                  </div>
                  <AppointmentStatusBadge status={appointment.status} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              description="Quando novas consultas forem agendadas, elas aparecerão aqui."
              title="Nenhuma consulta futura"
            />
          )}
        </PatientDashboardCard>

        <PatientDashboardCard
          description="Mensagens e recomendações enviadas especialmente para você."
          eyebrow="Cuidado contínuo"
          title="Orientações do profissional"
        >
          <PatientNotesList notes={notes} />
        </PatientDashboardCard>

        <PatientDashboardCard
          description="Links, PDFs, vídeos e outros conteúdos compartilhados para apoiar seu acompanhamento."
          eyebrow="Materiais"
          title="Recursos enviados"
        >
          <PatientResourcesList resources={resources} />
        </PatientDashboardCard>
      </div>
    </AppShell>
  );
}
