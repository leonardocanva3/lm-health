"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthNotice } from "@/components/auth/AuthNotice";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { WorkspaceMarketingMaterialsCard } from "@/components/workspaces/WorkspaceMarketingMaterialsCard";
import { WorkspacePublicPortalCard } from "@/components/workspaces/WorkspacePublicPortalCard";
import { WorkspaceSettingsForm } from "@/components/workspaces/WorkspaceSettingsForm";
import { isAdmin } from "@/lib/auth/roles";
import {
  getCurrentSession,
  getCurrentSessionProfile,
  signOut,
} from "@/lib/auth/session";
import type { SessionProfile } from "@/lib/auth/session";
import { ROUTES } from "@/lib/constants/routes";
import { updateWorkspaceSettings } from "@/lib/workspaces/actions";
import {
  getWorkspaceById,
  mapWorkspaceIdentity,
  type WorkspaceIdentity,
} from "@/lib/workspaces/queries";
import type { WorkspaceSettingsValues } from "@/lib/workspaces/schema";

export default function AdminConfiguracoesPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
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
          const workspaceData = await getWorkspaceById(currentProfile.workspaceId);

          if (isMounted) {
            setWorkspace(workspaceData);
          }
        }
      } catch {
        if (isMounted) {
          setErrorMessage("Não foi possível carregar as configurações.");
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
    setWorkspace(null);
  }

  async function handleSubmit(values: WorkspaceSettingsValues) {
    if (!profile?.workspaceId) {
      setErrorMessage("Seu perfil não está vinculado a um ambiente.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const updatedWorkspace = await updateWorkspaceSettings(
        profile.workspaceId,
        values,
      );

      setWorkspace(mapWorkspaceIdentity(updatedWorkspace));
      setSuccessMessage("Identidade atualizada com sucesso.");
    } catch (error) {
      setErrorMessage("Não foi possível salvar a identidade visual.");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Nao foi possivel salvar a identidade visual.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <AppShell section="admin" workspace={workspace}>
        <AuthNotice
          actionHref=""
          description="Estamos verificando sua sessão e ambiente."
          title="Carregando configurações"
        />
      </AppShell>
    );
  }

  if (!hasSession) {
    return (
      <AppShell section="admin" workspace={workspace}>
        <AuthNotice
          description="Entre com uma conta profissional para acessar configurações."
          title="Sessão ausente"
        />
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell section="admin" workspace={workspace}>
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
      <AppShell section="admin" workspace={workspace}>
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
      <AppShell section="admin" workspace={workspace}>
        <AuthNotice
          actionHref=""
          description="Seu perfil não está vinculado a um ambiente."
          title="Workspace ausente"
        />
      </AppShell>
    );
  }

  const currentWorkspace =
    workspace ??
    ({
      id: profile.workspaceId,
      address: null,
      businessHours: null,
      cityState: null,
      instagram: null,
      logoUrl: null,
      name: profile.name,
      phone: null,
      primaryColor: null,
      secondaryColor: null,
      site: null,
      slug: "",
      specialty: null,
      whatsapp: null,
    } satisfies WorkspaceIdentity);

  return (
    <AppShell section="admin" workspace={currentWorkspace}>
      <div className="space-y-8">
        <section className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white px-6 py-7 shadow-sm sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge>Configurações</Badge>
            <h1 className="mt-5 text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
              Identidade visual
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Ajuste o nome e a logotipo que aparecem no painel profissional e
              no portal do paciente.
            </p>
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

        {successMessage ? (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {successMessage}
          </div>
        ) : null}

        <WorkspacePublicPortalCard
          logo_url={currentWorkspace.logoUrl}
          name={currentWorkspace.name}
          primary_color={currentWorkspace.primaryColor}
          secondary_color={currentWorkspace.secondaryColor}
          slug={currentWorkspace.slug}
          specialty={currentWorkspace.specialty}
          whatsapp={currentWorkspace.whatsapp}
        />

        <WorkspaceMarketingMaterialsCard
          name={currentWorkspace.name}
          slug={currentWorkspace.slug}
          specialty={currentWorkspace.specialty}
        />

        <WorkspaceSettingsForm
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          profileWorkspaceId={profile.workspaceId}
          workspace={currentWorkspace}
        />
      </div>
    </AppShell>
  );
}
