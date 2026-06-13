"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthNotice } from "@/components/auth/AuthNotice";
import { AppShell } from "@/components/layout/AppShell";
import { PatientNoteForm } from "@/components/notes/PatientNoteForm";
import { PatientNotesTable } from "@/components/notes/PatientNotesTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { isAdmin } from "@/lib/auth/roles";
import {
  getCurrentSession,
  getCurrentSessionProfile,
  signOut,
} from "@/lib/auth/session";
import type { SessionProfile } from "@/lib/auth/session";
import {
  createPatientNote,
  setPatientNoteActive,
  updatePatientNote,
} from "@/lib/notes/actions";
import {
  listPatientNotes,
  type PatientNoteWithPatient,
} from "@/lib/notes/queries";
import type { PatientNoteFormValues } from "@/lib/notes/schema";
import { listPatients, type PatientRow } from "@/lib/patients/queries";
import {
  getWorkspaceById,
  type WorkspaceIdentity,
} from "@/lib/workspaces/queries";
import { ROUTES } from "@/lib/constants/routes";

export default function AdminOrientacoesPage() {
  const router = useRouter();
  const [busyNoteId, setBusyNoteId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<PatientNoteWithPatient | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState<PatientNoteWithPatient[]>([]);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [profile, setProfile] = useState<SessionProfile | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceIdentity | null>(null);

  async function refreshNotes(workspaceId: string) {
    const [noteRows, patientRows] = await Promise.all([
      listPatientNotes(workspaceId),
      listPatients(workspaceId),
    ]);

    setNotes(noteRows);
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
          const [noteRows, patientRows, workspaceData] = await Promise.all([
            listPatientNotes(currentProfile.workspaceId),
            listPatients(currentProfile.workspaceId),
            getWorkspaceById(currentProfile.workspaceId),
          ]);

          if (isMounted) {
            setNotes(noteRows);
            setPatients(patientRows.filter((patient) => patient.active));
            setWorkspace(workspaceData);
          }
        }
      } catch {
        if (isMounted) {
          setErrorMessage("Não foi possível carregar as orientações.");
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
    setNotes([]);
    setPatients([]);
    setWorkspace(null);
  }

  async function handleSubmit(values: PatientNoteFormValues) {
    if (!profile?.workspaceId) {
      setErrorMessage("Seu perfil não está vinculado a um ambiente.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    if (editingNote) {
      await updatePatientNote(editingNote.id, profile.workspaceId, values);
      setEditingNote(null);
      setSuccessMessage("Orientação atualizada com sucesso.");
    } else {
      await createPatientNote(profile, values);
      setSuccessMessage("Orientação criada com sucesso.");
    }

    await refreshNotes(profile.workspaceId);
  }

  async function handleToggleActive(note: PatientNoteWithPatient) {
    if (!profile?.workspaceId) {
      setErrorMessage("Seu perfil não está vinculado a um ambiente.");
      return;
    }

    setBusyNoteId(note.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await setPatientNoteActive(note.id, profile.workspaceId, !note.active);
      await refreshNotes(profile.workspaceId);
      setSuccessMessage(
        note.active
          ? "Orientação desativada com sucesso."
          : "Orientação ativada com sucesso.",
      );
    } catch {
      setErrorMessage("Não foi possível alterar o status da orientação.");
    } finally {
      setBusyNoteId(null);
    }
  }

  if (isLoading) {
    return (
      <AppShell section="admin">
        <AuthNotice
          actionHref=""
          description="Estamos verificando sua sessão e orientações."
          title="Carregando orientações"
        />
      </AppShell>
    );
  }

  if (!hasSession) {
    return (
      <AppShell section="admin">
        <AuthNotice
          description="Entre com uma conta profissional para acessar orientações."
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
            <Badge>Orientações</Badge>
            <h1 className="mt-5 text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
              Orientações personalizadas
            </h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Escreva mensagens e combinados clínicos para cada paciente,
              mantendo tudo vinculado ao seu ambiente.
            </p>
            <p className="mt-4 text-sm text-slate-500">
              {notes.length} orientação{notes.length === 1 ? "" : "ões"} cadastrada
              {notes.length === 1 ? "" : "s"}.
            </p>
          </div>
          <Button onClick={handleSignOut} variant="secondary">
            Sair
          </Button>
        </section>

        {patients.length === 0 ? (
          <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Cadastre um paciente ativo antes de criar orientações.
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
          <PatientNoteForm
            note={editingNote}
            onCancelEdit={() => setEditingNote(null)}
            onSubmit={handleSubmit}
            patients={patients}
          />
          <PatientNotesTable
            busyNoteId={busyNoteId}
            notes={notes}
            onEdit={setEditingNote}
            onToggleActive={handleToggleActive}
          />
        </section>
      </div>
    </AppShell>
  );
}
