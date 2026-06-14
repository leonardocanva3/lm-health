"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthNotice } from "@/components/auth/AuthNotice";
import { AppShell } from "@/components/layout/AppShell";
import { PatientForm } from "@/components/patients/PatientForm";
import { PatientsTable } from "@/components/patients/PatientsTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { isAdmin } from "@/lib/auth/roles";
import {
  getCurrentSession,
  getCurrentSessionProfile,
  signOut,
} from "@/lib/auth/session";
import type { SessionProfile } from "@/lib/auth/session";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  createPatient,
  setPatientActive,
  updatePatient,
} from "@/lib/patients/actions";
import { listPatients, type PatientRow } from "@/lib/patients/queries";
import type { PatientFormValues } from "@/lib/patients/schema";
import {
  getWorkspaceById,
  type WorkspaceIdentity,
} from "@/lib/workspaces/queries";
import { ROUTES } from "@/lib/constants/routes";

export default function AdminPatientsPage() {
  const router = useRouter();
  const [busyAccessPatientId, setBusyAccessPatientId] = useState<string | null>(null);
  const [busyPatientId, setBusyPatientId] = useState<string | null>(null);
  const [busyWhatsAppPatientId, setBusyWhatsAppPatientId] = useState<string | null>(null);
  const [editingPatient, setEditingPatient] = useState<PatientRow | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceIdentity | null>(null);

  async function refreshPatients(workspaceId: string) {
    const rows = await listPatients(workspaceId);
    setPatients(rows);
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

        if (
          currentProfile?.workspaceId &&
          isAdmin(currentProfile.role)
        ) {
          const [rows, workspaceData] = await Promise.all([
            listPatients(currentProfile.workspaceId),
            getWorkspaceById(currentProfile.workspaceId),
          ]);

          if (isMounted) {
            setPatients(rows);
            setWorkspace(workspaceData);
          }
        }
      } catch {
        if (isMounted) {
          setErrorMessage("Não foi possível carregar os pacientes.");
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
    setPatients([]);
    setWorkspace(null);
  }

  async function handleSubmit(values: PatientFormValues) {
    if (!profile?.workspaceId) {
      setErrorMessage("Seu perfil não está vinculado a um ambiente.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    if (editingPatient) {
      await updatePatient(editingPatient.id, profile.workspaceId, values);
      setEditingPatient(null);
      setSuccessMessage("Paciente atualizado com sucesso.");
    } else {
      await createPatient(profile, values);
      setSuccessMessage("Paciente cadastrado com sucesso.");
    }

    await refreshPatients(profile.workspaceId);
  }

  async function handleSendAccess(patient: PatientRow) {
    if (!patient.email) {
      setErrorMessage("Cadastre um email para enviar o acesso.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setBusyAccessPatientId(patient.id);

    try {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Sessão ausente. Entre novamente para enviar o acesso.");
      }

      const response = await fetch("/api/patient-access", {
        body: JSON.stringify({ patientId: patient.id }),
        headers: {
          authorization: `Bearer ${session.access_token}`,
          "content-type": "application/json",
        },
        method: "POST",
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Não foi possível enviar o acesso.");
      }

      if (profile?.workspaceId) {
        await refreshPatients(profile.workspaceId);
      }

      setSuccessMessage(payload.message ?? "Link de acesso enviado para o paciente.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível enviar o acesso.",
      );
    } finally {
      setBusyAccessPatientId(null);
    }
  }

  async function handleSendWhatsApp(patient: PatientRow) {
    if (!patient.phone) {
      setErrorMessage("Cadastre um telefone para enviar o acesso pelo WhatsApp.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setBusyWhatsAppPatientId(patient.id);

    try {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error("Sessão ausente. Entre novamente para enviar o acesso.");
      }

      const response = await fetch("/api/patient-access/whatsapp", {
        body: JSON.stringify({ patientId: patient.id }),
        headers: {
          authorization: `Bearer ${session.access_token}`,
          "content-type": "application/json",
        },
        method: "POST",
      });

      const payload = (await response.json()) as {
        error?: string;
        whatsappUrl?: string;
      };

      if (!response.ok || !payload.whatsappUrl) {
        throw new Error(
          payload.error ?? "Não foi possível gerar o acesso por WhatsApp.",
        );
      }

      window.open(payload.whatsappUrl, "_blank", "noopener,noreferrer");
      setSuccessMessage("Mensagem de WhatsApp pronta para envio.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível gerar o acesso por WhatsApp.",
      );
    } finally {
      setBusyWhatsAppPatientId(null);
    }
  }

  async function handleToggleActive(patient: PatientRow) {
    if (!profile?.workspaceId) {
      setErrorMessage("Seu perfil não está vinculado a um ambiente.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setBusyPatientId(patient.id);

    try {
      await setPatientActive(patient.id, profile.workspaceId, !patient.active);
      await refreshPatients(profile.workspaceId);
      setSuccessMessage(
        patient.active
          ? "Paciente desativado com sucesso."
          : "Paciente ativado com sucesso.",
      );
    } catch {
      setErrorMessage("Não foi possível alterar o status do paciente.");
    } finally {
      setBusyPatientId(null);
    }
  }

  if (isLoading) {
    return (
      <AppShell section="admin">
        <AuthNotice
          actionHref=""
          description="Estamos verificando sua sessão e ambiente."
          title="Carregando pacientes"
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
          description="Este módulo é restrito a owners e admins."
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

  return (
    <AppShell section="admin" workspace={workspace}>
      <div className="space-y-8">
        <section className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white px-6 py-7 shadow-sm sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge>Pacientes</Badge>
            <h1 className="mt-5 text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
              Gestão de pacientes
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Cadastre, atualize e acompanhe pacientes do ambiente logado com
              uma interface simples e segura.
            </p>
            <p className="mt-4 text-sm text-slate-500">
              {patients.length} paciente{patients.length === 1 ? "" : "s"} no ambiente.
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

        {successMessage ? (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {successMessage}
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.4fr]">
          <PatientForm
            onCancelEdit={() => setEditingPatient(null)}
            onSubmit={handleSubmit}
            patient={editingPatient}
          />
          <PatientsTable
            busyAccessPatientId={busyAccessPatientId}
            busyPatientId={busyPatientId}
            busyWhatsAppPatientId={busyWhatsAppPatientId}
            onEdit={setEditingPatient}
            onSendAccess={handleSendAccess}
            onSendWhatsApp={handleSendWhatsApp}
            onToggleActive={handleToggleActive}
            patients={patients}
          />
        </section>
      </div>
    </AppShell>
  );
}
