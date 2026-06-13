"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthNotice } from "@/components/auth/AuthNotice";
import { AppShell } from "@/components/layout/AppShell";
import { PatientResourceForm } from "@/components/resources/PatientResourceForm";
import { PatientResourcesTable } from "@/components/resources/PatientResourcesTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { isAdmin } from "@/lib/auth/roles";
import {
  getCurrentSession,
  getCurrentSessionProfile,
  signOut,
} from "@/lib/auth/session";
import type { SessionProfile } from "@/lib/auth/session";
import { listPatients, type PatientRow } from "@/lib/patients/queries";
import {
  createPatientResource,
  setPatientResourceActive,
  updatePatientResource,
} from "@/lib/resources/actions";
import {
  listPatientResources,
  type PatientResourceWithPatient,
} from "@/lib/resources/queries";
import type { PatientResourceFormValues } from "@/lib/resources/schema";
import {
  getWorkspaceById,
  type WorkspaceIdentity,
} from "@/lib/workspaces/queries";
import { ROUTES } from "@/lib/constants/routes";

export default function AdminRecursosPage() {
  const router = useRouter();
  const [busyResourceId, setBusyResourceId] = useState<string | null>(null);
  const [editingResource, setEditingResource] =
    useState<PatientResourceWithPatient | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const [resources, setResources] = useState<PatientResourceWithPatient[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceIdentity | null>(null);

  async function refreshResources(workspaceId: string) {
    const [resourceRows, patientRows] = await Promise.all([
      listPatientResources(workspaceId),
      listPatients(workspaceId),
    ]);

    setResources(resourceRows);
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
          const [resourceRows, patientRows, workspaceData] = await Promise.all([
            listPatientResources(currentProfile.workspaceId),
            listPatients(currentProfile.workspaceId),
            getWorkspaceById(currentProfile.workspaceId),
          ]);

          if (isMounted) {
            setResources(resourceRows);
            setPatients(patientRows.filter((patient) => patient.active));
            setWorkspace(workspaceData);
          }
        }
      } catch {
        if (isMounted) {
          setErrorMessage("Não foi possível carregar os recursos.");
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
    setResources([]);
    setWorkspace(null);
  }

  async function handleSubmit(values: PatientResourceFormValues) {
    if (!profile?.workspaceId) {
      setErrorMessage("Seu perfil não está vinculado a um ambiente.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    if (editingResource) {
      await updatePatientResource(editingResource.id, profile.workspaceId, values);
      setEditingResource(null);
      setSuccessMessage("Recurso atualizado com sucesso.");
    } else {
      await createPatientResource(profile, values);
      setSuccessMessage("Recurso criado com sucesso.");
    }

    await refreshResources(profile.workspaceId);
  }

  async function handleToggleActive(resource: PatientResourceWithPatient) {
    if (!profile?.workspaceId) {
      setErrorMessage("Seu perfil não está vinculado a um ambiente.");
      return;
    }

    setBusyResourceId(resource.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await setPatientResourceActive(resource.id, profile.workspaceId, !resource.active);
      await refreshResources(profile.workspaceId);
      setSuccessMessage(
        resource.active
          ? "Recurso desativado com sucesso."
          : "Recurso ativado com sucesso.",
      );
    } catch {
      setErrorMessage("Não foi possível alterar o status do recurso.");
    } finally {
      setBusyResourceId(null);
    }
  }

  if (isLoading) {
    return (
      <AppShell section="admin">
        <AuthNotice
          actionHref=""
          description="Estamos verificando sua sessão e recursos."
          title="Carregando recursos"
        />
      </AppShell>
    );
  }

  if (!hasSession) {
    return (
      <AppShell section="admin">
        <AuthNotice
          description="Entre com uma conta profissional para acessar recursos."
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
            <Badge>Recursos</Badge>
            <h1 className="mt-5 text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
              Recursos do paciente
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Compartilhe YouTube, Spotify, PDFs por URL e outros links sem
              usar upload nesta fase.
            </p>
            <p className="mt-4 text-sm text-slate-500">
              {resources.length} recurso{resources.length === 1 ? "" : "s"} cadastrado
              {resources.length === 1 ? "" : "s"}.
            </p>
          </div>
          <Button onClick={handleSignOut} variant="secondary">
            Sair
          </Button>
        </section>

        {patients.length === 0 ? (
          <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Cadastre um paciente ativo antes de criar recursos.
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

        <section className="grid gap-6 xl:grid-cols-[0.9fr_1.4fr]">
          <PatientResourceForm
            onCancelEdit={() => setEditingResource(null)}
            onSubmit={handleSubmit}
            patients={patients}
            resource={editingResource}
          />
          <PatientResourcesTable
            busyResourceId={busyResourceId}
            onEdit={setEditingResource}
            onToggleActive={handleToggleActive}
            resources={resources}
          />
        </section>
      </div>
    </AppShell>
  );
}
