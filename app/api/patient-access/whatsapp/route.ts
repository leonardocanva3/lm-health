import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/auth/roles";
import {
  createPatientAccessToken,
  getPatientAccessBaseUrl,
  hashPatientAccessToken,
  normalizeBrazilPhone,
  PATIENT_ACCESS_TOKEN_DAYS,
  type PatientAccessPatient,
} from "@/lib/patient-access/server";

type AdminProfile = {
  active: boolean;
  id: string;
  role: UserRole;
  workspace_id: string | null;
};

function isDevelopment() {
  return process.env.NODE_ENV === "development";
}

function jsonError(
  message: string,
  status = 400,
  details?: Record<string, unknown>,
) {
  return Response.json(
    {
      error: message,
      ...(isDevelopment() && details ? { details } : {}),
    },
    { status },
  );
}

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

async function getAuthorizedAdmin(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return {
      response: jsonError("Sessao ausente. Entre novamente para enviar o acesso.", 401),
    };
  }

  const authClient = createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(token);

  if (userError || !user) {
    return {
      response: jsonError("Sessao invalida. Entre novamente para enviar o acesso.", 401),
    };
  }

  const adminClient = createSupabaseAdminClient();
  const { data, error } = await adminClient
    .from("profiles")
    .select("id, workspace_id, role, active")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return {
      response: jsonError("Nao foi possivel validar seu perfil.", 500, {
        errorMessage: error.message,
      }),
    };
  }

  const profile = data as AdminProfile | null;

  if (!profile?.active) {
    return {
      response: jsonError("Perfil profissional inativo ou nao encontrado.", 403),
    };
  }

  if (profile.role !== "owner" && profile.role !== "admin") {
    return {
      response: jsonError("Voce nao tem permissao para enviar acesso.", 403),
    };
  }

  if (!profile.workspace_id) {
    return {
      response: jsonError("Ambiente nao encontrado para seu perfil.", 403),
    };
  }

  return { adminClient, profile };
}

function buildWhatsAppMessage(patientName: string, accessLink: string) {
  return `Olá, ${patientName}! Sua Área do Paciente foi criada.\n\nAcesse pelo link seguro:\n${accessLink}\n\nPor lá você poderá visualizar orientações, materiais e informações compartilhadas durante o acompanhamento.`;
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthorizedAdmin(request);

    if ("response" in auth) {
      return auth.response;
    }

    const { adminClient, profile } = auth;
    const workspaceId = profile.workspace_id;

    if (!workspaceId) {
      return jsonError("Ambiente nao encontrado para seu perfil.", 403);
    }

    const body = (await request.json()) as { patientId?: unknown };
    const patientId = typeof body.patientId === "string" ? body.patientId : null;

    if (!patientId) {
      return jsonError("Paciente invalido.");
    }

    const { data: patientData, error: patientError } = await adminClient
      .from("patients")
      .select("id, workspace_id, profile_id, name, email, phone, active")
      .eq("id", patientId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (patientError) {
      return jsonError("Nao foi possivel carregar o paciente.", 500, {
        errorMessage: patientError.message,
      });
    }

    const patient = patientData as PatientAccessPatient | null;

    if (!patient) {
      return jsonError("Paciente nao encontrado neste workspace.", 404);
    }

    if (!patient.active) {
      return jsonError("Ative o paciente antes de enviar o acesso.");
    }

    const phone = normalizeBrazilPhone(patient.phone);

    if (!phone) {
      return jsonError("Cadastre um telefone para enviar o acesso pelo WhatsApp.");
    }

    const token = createPatientAccessToken();
    const tokenHash = hashPatientAccessToken(token);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + PATIENT_ACCESS_TOKEN_DAYS);

    const { error: tokenError } = await adminClient
      .from("patient_access_tokens")
      .insert({
        expires_at: expiresAt.toISOString(),
        patient_id: patient.id,
        token_hash: tokenHash,
        workspace_id: workspaceId,
      });

    if (tokenError) {
      return jsonError("Nao foi possivel gerar o link seguro.", 500, {
        errorMessage: tokenError.message,
      });
    }

    const accessLink = `${getPatientAccessBaseUrl()}/paciente/acessar?token=${encodeURIComponent(token)}`;
    const message = buildWhatsAppMessage(patient.name, accessLink);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    return Response.json({
      accessLink,
      expiresAt: expiresAt.toISOString(),
      message,
      whatsappUrl,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "Nao foi possivel gerar o acesso por WhatsApp.",
      500,
      { hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) },
    );
  }
}
