"use client";

import { endOfDay, format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AppointmentForm } from "@/components/appointments/AppointmentForm";
import { AppointmentStatusBadge } from "@/components/appointments/AppointmentStatusBadge";
import { AppointmentsTable } from "@/components/appointments/AppointmentsTable";
import { AuthNotice } from "@/components/auth/AuthNotice";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  createAppointment,
  setAppointmentStatus,
  updateAppointment,
} from "@/lib/appointments/actions";
import {
  listAppointments,
  type AppointmentWithPatient,
} from "@/lib/appointments/queries";
import type {
  AppointmentFormValues,
  AppointmentStatus,
} from "@/lib/appointments/schema";
import { isAdmin } from "@/lib/auth/roles";
import {
  getCurrentSession,
  getCurrentSessionProfile,
  signOut,
} from "@/lib/auth/session";
import type { SessionProfile } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { listPatients, type PatientRow } from "@/lib/patients/queries";
import {
  getWorkspaceById,
  type WorkspaceIdentity,
} from "@/lib/workspaces/queries";

function appointmentDate(value: string | null) {
  return value ? new Date(value) : null;
}

function formatAppointmentDate(value: string | null) {
  const date = appointmentDate(value);

  if (!date) {
    return "Data não informada";
  }

  return format(date, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
}

function isTodayAppointment(appointment: AppointmentWithPatient) {
  const date = appointmentDate(appointment.scheduled_at);

  if (!date) {
    return false;
  }

  const now = new Date();
  return date >= startOfDay(now) && date <= endOfDay(now);
}

function isFutureScheduled(appointment: AppointmentWithPatient) {
  const date = appointmentDate(appointment.scheduled_at);

  return Boolean(
    date && date >= new Date() && appointment.status === "scheduled",
  );
}

function getStatusMessage(status: AppointmentStatus) {
  if (status === "completed") {
    return "Consulta marcada como realizada.";
  }

  if (status === "missed") {
    return "Consulta marcada como falta.";
  }

  if (status === "canceled") {
    return "Consulta cancelada com sucesso.";
  }

  return "Status da consulta atualizado.";
}

export default function AdminAgendaPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentWithPatient[]>([]);
  const [busyAppointmentId, setBusyAppointmentId] = useState<string | null>(null);
  const [editingAppointment, setEditingAppointment] =
    useState<AppointmentWithPatient | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceIdentity | null>(null);

  async function refreshAgenda(workspaceId: string) {
    const [appointmentRows, patientRows] = await Promise.all([
      listAppointments(workspaceId),
      listPatients(workspaceId),
    ]);

    setAppointments(appointmentRows);
    setPatients(patientRows.filter((patient) => patient.active));
  }

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
          const [appointmentRows, patientRows, workspaceData] = await Promise.all([
            listAppointments(currentProfile.workspaceId),
            listPatients(currentProfile.workspaceId),
            getWorkspaceById(currentProfile.workspaceId),
          ]);

          if (isMounted) {
            setAppointments(appointmentRows);
            setPatients(patientRows.filter((patient) => patient.active));
            setWorkspace(workspaceData);
          }
        }
      } catch {
        if (isMounted) {
          setErrorMessage("Não foi possível carregar a agenda.");
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
  }, [router]);

  async function handleSignOut() {
    await signOut();
    setHasSession(false);
    setProfile(null);
    setAppointments([]);
    setPatients([]);
    setWorkspace(null);
  }

  async function handleSubmit(values: AppointmentFormValues) {
    if (!profile?.workspaceId) {
      setErrorMessage("Seu perfil não está vinculado a um ambiente.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    if (editingAppointment) {
      await updateAppointment(editingAppointment.id, profile.workspaceId, values);
      setEditingAppointment(null);
      setSuccessMessage("Consulta atualizada com sucesso.");
    } else {
      await createAppointment(profile, values);
      setSuccessMessage("Consulta cadastrada com sucesso.");
    }

    await refreshAgenda(profile.workspaceId);
  }

  async function handleSetStatus(
    appointment: AppointmentWithPatient,
    status: AppointmentStatus,
  ) {
    if (!profile?.workspaceId) {
      setErrorMessage("Seu perfil não está vinculado a um ambiente.");
      return;
    }

    setBusyAppointmentId(appointment.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await setAppointmentStatus(appointment.id, profile.workspaceId, status);
      await refreshAgenda(profile.workspaceId);
      setSuccessMessage(getStatusMessage(status));
    } catch {
      setErrorMessage("Não foi possível atualizar o status da consulta.");
    } finally {
      setBusyAppointmentId(null);
    }
  }

  if (isLoading) {
    return (
      <AppShell section="admin">
        <AuthNotice
          actionHref=""
          description="Estamos verificando sua sessão e agenda."
          title="Carregando agenda"
        />
      </AppShell>
    );
  }

  if (!hasSession) {
    return (
      <AppShell section="admin">
        <AuthNotice
          description="Entre com uma conta profissional para acessar a agenda."
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
          description="Você não tem permissão para acessar esta área."
          title="Acesso restrito"
        />
      </AppShell>
    );
  }

  if (!profile.workspaceId) {
    return (
      <AppShell section="admin">
        <AuthNotice
          actionHref=""
          description="Seu perfil não está vinculado a um ambiente."
          title="Workspace ausente"
        />
      </AppShell>
    );
  }

  const todayAppointments = appointments.filter(isTodayAppointment);
  const futureScheduledAppointments = appointments.filter(isFutureScheduled);
  const nextAppointment = futureScheduledAppointments[0] ?? null;
  const completedCount = appointments.filter(
    (appointment) => appointment.status === "completed",
  ).length;
  const missedCount = appointments.filter(
    (appointment) => appointment.status === "missed",
  ).length;

  const summaryCards = [
    {
      label: "Atendimentos hoje",
      value: todayAppointments.length,
      detail: "Consultas marcadas para hoje",
    },
    {
      label: "Próximas agendadas",
      value: futureScheduledAppointments.length,
      detail: "Consultas futuras em aberto",
    },
    {
      label: "Realizadas",
      value: completedCount,
      detail: "Historico do ambiente",
    },
    {
      label: "Faltas",
      value: missedCount,
      detail: "Consultas marcadas como falta",
    },
  ];

  return (
    <AppShell section="admin" workspace={workspace}>
      <div className="space-y-8">
        <section className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white px-6 py-7 shadow-sm sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge>Agenda</Badge>
            <h1 className="mt-5 text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
              Agenda profissional
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Organize atendimentos, acompanhe presença e mantenha a rotina do
              consultório clara para o dia a dia.
            </p>
            <p className="mt-4 text-sm text-slate-500">
              {appointments.length} consulta{appointments.length === 1 ? "" : "s"} no
              seu ambiente.
            </p>
          </div>
          <Button onClick={handleSignOut} variant="secondary">
            Sair
          </Button>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <Card className="p-5" key={card.label}>
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="mt-4 text-3xl font-semibold text-slate-950">
                {card.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{card.detail}</p>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-6">
            <p className="text-sm font-medium text-emerald-800">Próxima consulta</p>
            {nextAppointment ? (
              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-950">
                      {nextAppointment.patient_name ?? "Paciente"}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {formatAppointmentDate(nextAppointment.scheduled_at)}
                    </p>
                  </div>
                  <AppointmentStatusBadge status={nextAppointment.status} />
                </div>
                {nextAppointment.notes ? (
                  <p className="mt-4 rounded-xl bg-white/80 px-4 py-3 text-sm leading-6 text-slate-600">
                    {nextAppointment.notes}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h2 className="text-base font-semibold text-slate-950">
                  Nenhuma consulta futura
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Assim que uma consulta for agendada, ela aparecerá em destaque.
                </p>
              </div>
            )}
          </Card>

          <Card className="p-6">
            <p className="text-sm font-medium text-emerald-800">Hoje</p>
            <h2 className="mt-2 text-xl font-semibold text-slate-950">
              Atendimentos do dia
            </h2>
            {todayAppointments.length > 0 ? (
              <div className="mt-5 space-y-3">
                {todayAppointments.slice(0, 4).map((appointment) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
                    key={appointment.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {appointment.patient_name ?? "Paciente"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(appointment.scheduled_at ?? ""), "HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <AppointmentStatusBadge status={appointment.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 rounded-xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                Nenhuma consulta marcada para hoje.
              </p>
            )}
          </Card>
        </section>

        {patients.length === 0 ? (
          <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Nenhum paciente ativo cadastrado. Cadastre um paciente antes de criar
            consultas.
          </div>
        ) : null}

        {futureScheduledAppointments.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            Nenhuma consulta futura agendada no momento.
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {successMessage}
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[0.85fr_1.45fr]">
          <AppointmentForm
            appointment={editingAppointment}
            onCancelEdit={() => setEditingAppointment(null)}
            onSubmit={handleSubmit}
            patients={patients}
          />
          <AppointmentsTable
            appointments={appointments}
            busyAppointmentId={busyAppointmentId}
            onEdit={setEditingAppointment}
            onSetStatus={handleSetStatus}
          />
        </section>
      </div>
    </AppShell>
  );
}
