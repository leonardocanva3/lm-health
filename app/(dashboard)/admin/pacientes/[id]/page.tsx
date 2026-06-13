"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import { AuthNotice } from "@/components/auth/AuthNotice";
import { AppShell } from "@/components/layout/AppShell";
import { PatientNoteCard } from "@/components/notes/PatientNoteCard";
import { PatientStatusBadge } from "@/components/patients/PatientStatusBadge";
import { PatientResourceCard } from "@/components/resources/PatientResourceCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  getCurrentSession,
  getCurrentSessionProfile,
  signOut,
} from "@/lib/auth/session";
import type { SessionProfile } from "@/lib/auth/session";
import { isAdmin } from "@/lib/auth/roles";
import {
  getNextPatientAppointment,
  type AppointmentWithPatient,
} from "@/lib/appointments/queries";
import { listNotesByPatient, type PatientNoteWithPatient } from "@/lib/notes/queries";
import { getPatientById, type PatientRow } from "@/lib/patients/queries";
import {
  listResourcesByPatient,
  type PatientResourceWithPatient,
} from "@/lib/resources/queries";
import { ROUTES } from "@/lib/constants/routes";
import {
  getWorkspaceById,
  type WorkspaceIdentity,
} from "@/lib/workspaces/queries";

function formatDate(value: string | null) {
  if (!value) {
    return "Não informado";
  }

  return format(new Date(value), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

function formatAppointment(value: string | null) {
  if (!value) {
    return "Data não informada";
  }

  return format(new Date(value), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
}

export default function AdminPatientDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [hasSession, setHasSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [nextAppointment, setNextAppointment] =
    useState<AppointmentWithPatient | null>(null);
  const [notes, setNotes] = useState<PatientNoteWithPatient[]>([]);
  const [patient, setPatient] = useState<PatientRow | null>(null);
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const [resources, setResources] = useState<PatientResourceWithPatient[]>([]);
  const [workspace, setWorkspace] = useState<WorkspaceIdentity | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadPage() {
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

        if (!isMounted) {
          return;
        }

        setProfile(currentProfile);

        if (currentProfile?.workspaceId && isAdmin(currentProfile.role)) {
          const [patientRow, appointmentRow, noteRows, resourceRows, workspaceData] =
            await Promise.all([
              getPatientById(currentProfile.workspaceId, params.id),
              getNextPatientAppointment(currentProfile.workspaceId, params.id),
              listNotesByPatient(currentProfile.workspaceId, params.id),
              listResourcesByPatient(currentProfile.workspaceId, params.id),
              getWorkspaceById(currentProfile.workspaceId),
            ]);

          if (isMounted) {
            setPatient(patientRow);
            setNextAppointment(appointmentRow);
            setNotes(noteRows);
            setResources(resourceRows);
            setWorkspace(workspaceData);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadPage();

    return () => {
      isMounted = false;
    };
  }, [params.id, router]);

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
          description="Estamos carregando o prontuário operacional do paciente."
          title="Carregando paciente"
        />
      </AppShell>
    );
  }

  if (!hasSession) {
    return (
      <AppShell section="admin">
        <AuthNotice
          description="Entre com uma conta profissional para acessar pacientes."
          title="Sessão ausente"
        />
      </AppShell>
    );
  }

  if (!profile || !isAdmin(profile.role)) {
    return (
      <AppShell section="admin">
        <AuthNotice
          actionHref=""
          description="Este detalhe é restrito a owners e admins."
          title="Acesso restrito"
        />
      </AppShell>
    );
  }

  if (!patient) {
    return (
      <AppShell section="admin">
        <AuthNotice
          actionHref={ROUTES.adminPacientes}
          actionLabel="Voltar para pacientes"
          description="Não encontramos este paciente no ambiente logado."
          title="Paciente não encontrado"
        />
      </AppShell>
    );
  }

  return (
    <AppShell section="admin" workspace={workspace}>
      <div className="space-y-8">
        <section className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white px-6 py-7 shadow-sm sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge>Paciente</Badge>
            <h1 className="mt-5 text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
              {patient.name}
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Visão rápida de acesso, consulta, orientações e recursos.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <PatientStatusBadge active={patient.active} />
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {patient.profile_id ? "Acesso vinculado" : "Acesso não vinculado"}
              </span>
            </div>
          </div>
          <Button onClick={handleSignOut} variant="secondary">
            Sair
          </Button>
        </section>

        <section className="grid gap-4 lg:grid-cols-4">
          <Card>
            <p className="text-sm font-medium text-slate-500">Email</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {patient.email ?? "Não informado"}
            </p>
          </Card>
          <Card>
            <p className="text-sm font-medium text-slate-500">Telefone</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {patient.phone ?? "Não informado"}
            </p>
          </Card>
          <Card>
            <p className="text-sm font-medium text-slate-500">Nascimento</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {formatDate(patient.birth_date)}
            </p>
          </Card>
          <Card>
            <p className="text-sm font-medium text-slate-500">Acesso</p>
            <p className="mt-2 text-sm font-semibold text-slate-950">
              {patient.profile_id ? "Vinculado" : "Pendente"}
            </p>
          </Card>
        </section>

        <section className="flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-700 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-800"
            href={ROUTES.adminAgenda}
          >
            + nova consulta
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50"
            href={ROUTES.adminOrientacoes}
          >
            + nova orientação
          </Link>
          <Link
            className="inline-flex h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 shadow-sm transition-colors hover:bg-slate-50"
            href={ROUTES.adminRecursos}
          >
            + novo recurso
          </Link>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="p-6">
            <span className="text-2xl">📅</span>
            <h2 className="mt-3 text-xl font-semibold text-slate-950">
              Próxima consulta
            </h2>
            {nextAppointment ? (
              <div className="mt-3 space-y-3">
                <p className="text-sm leading-6 text-slate-600">
                  {formatAppointment(nextAppointment.scheduled_at)}
                </p>
                <AppointmentStatusBadge status={nextAppointment.status} />
                {nextAppointment.notes ? (
                  <p className="text-sm leading-6 text-slate-500">
                    {nextAppointment.notes}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Nenhuma consulta futura cadastrada.
              </p>
            )}
          </Card>
          <Card className="p-6">
            <span className="text-2xl">🔐</span>
            <h2 className="mt-3 text-xl font-semibold text-slate-950">
              Status do acesso
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {patient.profile_id
                ? "Este paciente já está vinculado a um usuário de acesso."
                : "Crie um usuário no Supabase Auth, crie um profile patient e vincule patients.profile_id ao ID desse usuário."}
            </p>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-950">📝 Orientações</h2>
          {notes.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {notes.slice(0, 4).map((note) => (
                <PatientNoteCard key={note.id} note={note} />
              ))}
            </div>
          ) : (
            <Card className="p-6 text-sm text-slate-600">
              Nenhuma orientação cadastrada.
            </Card>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-950">📚 Recursos</h2>
          {resources.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {resources.slice(0, 4).map((resource) => (
                <PatientResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : (
            <Card className="p-6 text-sm text-slate-600">
              Nenhum recurso cadastrado.
            </Card>
          )}
        </section>
      </div>
    </AppShell>
  );
}
