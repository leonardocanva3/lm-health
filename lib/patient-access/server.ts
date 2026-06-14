import "server-only";

import { createHash, createHmac, randomBytes } from "node:crypto";

import type { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type SupabaseAdminClient = ReturnType<typeof createSupabaseAdminClient>;

export type PatientAccessPatient = Pick<
  Database["public"]["Tables"]["patients"]["Row"],
  | "active"
  | "birth_date"
  | "email"
  | "id"
  | "name"
  | "phone"
  | "profile_id"
  | "public_access_enabled"
  | "public_access_token_created_at"
  | "public_access_token_hash"
  | "workspace_id"
>;

type PatientProfile = Database["public"]["Tables"]["profiles"]["Row"];

export const PATIENT_ACCESS_TOKEN_DAYS = 7;

export function createPatientAccessToken() {
  return randomBytes(32).toString("base64url");
}

export function hashPatientAccessToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function getPatientAuthEmail(patient: Pick<PatientAccessPatient, "email" | "id">) {
  const email = patient.email?.trim().toLowerCase();

  if (email) {
    return email;
  }

  return `patient-${patient.id}@patients.lmhealth.local`;
}

export function getPatientRedirectUrl() {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000/paciente";
  }

  return "https://app.oleonardomachado.com.br/paciente";
}

export function getPatientAccessBaseUrl() {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  return "https://app.oleonardomachado.com.br";
}

export function getPatientPublicAccessUrl(token: string) {
  return `${getPatientAccessBaseUrl()}/paciente/acesso/${encodeURIComponent(token)}`;
}

function getPatientPublicAccessSecret() {
  const secret =
    process.env.PATIENT_PUBLIC_ACCESS_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error("Configure PATIENT_PUBLIC_ACCESS_SECRET para gerar links publicos.");
  }

  return secret;
}

function createPublicAccessToken({
  createdAt,
  patientId,
  workspaceId,
}: {
  createdAt: string;
  patientId: string;
  workspaceId: string;
}) {
  return createHmac("sha256", getPatientPublicAccessSecret())
    .update(`${workspaceId}:${patientId}:${createdAt}`)
    .digest("base64url");
}

export function hashPatientPublicAccessToken(token: string) {
  return hashPatientAccessToken(token);
}

export function normalizeBrazilPhone(value: string | null) {
  const digits = value?.replace(/\D/g, "") ?? "";

  if (!digits) {
    return null;
  }

  if (digits.startsWith("55")) {
    return digits;
  }

  return `55${digits}`;
}

export async function ensurePatientPublicAccess({
  adminClient,
  patient,
  workspaceId,
}: {
  adminClient: SupabaseAdminClient;
  patient: PatientAccessPatient;
  workspaceId: string;
}) {
  if (patient.workspace_id !== workspaceId) {
    throw new Error("Paciente nao pertence a este workspace.");
  }

  if (!patient.active) {
    throw new Error("Ative o paciente antes de enviar o acesso.");
  }

  const createdAt =
    patient.public_access_token_created_at ?? new Date().toISOString();
  const token = createPublicAccessToken({
    createdAt,
    patientId: patient.id,
    workspaceId,
  });
  const tokenHash = hashPatientPublicAccessToken(token);

  if (
    patient.public_access_enabled &&
    patient.public_access_token_created_at &&
    patient.public_access_token_hash === tokenHash
  ) {
    return {
      accessLink: getPatientPublicAccessUrl(token),
      token,
      tokenHash,
    };
  }

  const { error } = await adminClient
    .from("patients")
    .update({
      public_access_enabled: true,
      public_access_token_created_at: createdAt,
      public_access_token_hash: tokenHash,
      updated_at: new Date().toISOString(),
    })
    .eq("id", patient.id)
    .eq("workspace_id", workspaceId);

  if (error) {
    throw error;
  }

  return {
    accessLink: getPatientPublicAccessUrl(token),
    token,
    tokenHash,
  };
}

export async function regeneratePatientPublicAccess({
  adminClient,
  patient,
  workspaceId,
}: {
  adminClient: SupabaseAdminClient;
  patient: PatientAccessPatient;
  workspaceId: string;
}) {
  const createdAt = new Date().toISOString();
  const token = createPublicAccessToken({
    createdAt,
    patientId: patient.id,
    workspaceId,
  });
  const tokenHash = hashPatientPublicAccessToken(token);

  const { error } = await adminClient
    .from("patients")
    .update({
      public_access_enabled: true,
      public_access_token_created_at: createdAt,
      public_access_token_hash: tokenHash,
      updated_at: createdAt,
    })
    .eq("id", patient.id)
    .eq("workspace_id", workspaceId);

  if (error) {
    throw error;
  }

  return {
    accessLink: getPatientPublicAccessUrl(token),
    token,
    tokenHash,
  };
}

export async function disablePatientPublicAccess({
  adminClient,
  patientId,
  workspaceId,
}: {
  adminClient: SupabaseAdminClient;
  patientId: string;
  workspaceId: string;
}) {
  const { error } = await adminClient
    .from("patients")
    .update({
      public_access_enabled: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", patientId)
    .eq("workspace_id", workspaceId);

  if (error) {
    throw error;
  }
}

async function findAuthUserByEmail(
  adminClient: SupabaseAdminClient,
  email: string,
) {
  const normalizedEmail = email.toLowerCase();
  const perPage = 1000;

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw error;
    }

    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === normalizedEmail,
    );

    if (user) {
      return user;
    }

    if (data.users.length < perPage) {
      return null;
    }
  }

  throw new Error("Nao foi possivel localizar o usuario Auth por email.");
}

export async function getOrCreatePatientAuthUser(
  adminClient: SupabaseAdminClient,
  email: string,
) {
  const existingUser = await findAuthUserByEmail(adminClient, email);

  if (existingUser) {
    return existingUser;
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
  });

  if (error || !data.user) {
    throw error ?? new Error("Nao foi possivel criar o usuario Auth.");
  }

  return data.user;
}

export async function ensurePatientAuthAccess({
  adminClient,
  patient,
  workspaceId,
}: {
  adminClient: SupabaseAdminClient;
  patient: PatientAccessPatient;
  workspaceId: string;
}) {
  if (patient.workspace_id !== workspaceId) {
    throw new Error("Paciente nao pertence a este workspace.");
  }

  if (!patient.active) {
    throw new Error("Ative o paciente antes de enviar o acesso.");
  }

  const email = getPatientAuthEmail(patient);
  const authUser = await getOrCreatePatientAuthUser(adminClient, email);
  const { data: existingProfileData, error: profileError } = await adminClient
    .from("profiles")
    .select("id, workspace_id, name, email, role, active, created_at, updated_at")
    .eq("id", authUser.id)
    .maybeSingle();

  if (profileError) {
    throw profileError;
  }

  const existingProfile = existingProfileData as PatientProfile | null;

  if (existingProfile?.workspace_id && existingProfile.workspace_id !== workspaceId) {
    throw new Error(
      "Este contato ja esta vinculado a outro workspace. Revise o cadastro antes de enviar.",
    );
  }

  if (existingProfile && existingProfile.role !== "patient") {
    throw new Error("Este contato pertence a um perfil profissional.");
  }

  const { error: upsertProfileError } = await adminClient.from("profiles").upsert({
    active: true,
    email,
    id: authUser.id,
    name: patient.name,
    role: "patient",
    updated_at: new Date().toISOString(),
    workspace_id: workspaceId,
  });

  if (upsertProfileError) {
    throw upsertProfileError;
  }

  const { error: updatePatientError } = await adminClient
    .from("patients")
    .update({
      profile_id: authUser.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", patient.id)
    .eq("workspace_id", workspaceId);

  if (updatePatientError) {
    throw updatePatientError;
  }

  return { authUser, email };
}
