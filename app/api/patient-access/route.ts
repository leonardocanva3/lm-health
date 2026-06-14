import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/auth/roles";
import type { Database } from "@/types/database";

type AdminProfile = {
  active: boolean;
  id: string;
  role: UserRole;
  workspace_id: string | null;
};

type PatientForAccess = {
  active: boolean;
  email: string | null;
  id: string;
  name: string;
  profile_id: string | null;
  workspace_id: string | null;
};

type PatientProfile = Database["public"]["Tables"]["profiles"]["Row"];

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

function getPatientRedirectUrl(request: Request) {
  if (isDevelopment()) {
    return new URL("/paciente", request.url).toString();
  }

  return "https://app.oleonardomachado.com.br/paciente";
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

async function findAuthUserByEmail(
  adminClient: ReturnType<typeof createSupabaseAdminClient>,
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

async function getOrCreateAuthUser(
  adminClient: ReturnType<typeof createSupabaseAdminClient>,
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
      .select("id, workspace_id, profile_id, name, email, active")
      .eq("id", patientId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (patientError) {
      return jsonError("Nao foi possivel carregar o paciente.", 500, {
        errorMessage: patientError.message,
      });
    }

    const patient = patientData as PatientForAccess | null;

    if (!patient) {
      return jsonError("Paciente nao encontrado neste workspace.", 404);
    }

    if (!patient.active) {
      return jsonError("Ative o paciente antes de enviar o acesso.");
    }

    const patientEmail = patient.email?.trim().toLowerCase();

    if (!patientEmail) {
      return jsonError("Cadastre um email para enviar o acesso.");
    }

    const authUser = await getOrCreateAuthUser(adminClient, patientEmail);
    const { data: existingProfileData, error: profileError } = await adminClient
      .from("profiles")
      .select("id, workspace_id, name, email, role, active, created_at, updated_at")
      .eq("id", authUser.id)
      .maybeSingle();

    if (profileError) {
      return jsonError("Nao foi possivel validar o perfil do paciente.", 500, {
        errorMessage: profileError.message,
      });
    }

    const existingProfile = existingProfileData as PatientProfile | null;

    if (
      existingProfile?.workspace_id &&
      existingProfile.workspace_id !== workspaceId
    ) {
      return jsonError(
        "Este email ja esta vinculado a outro workspace. Revise o cadastro antes de enviar.",
        409,
      );
    }

    if (existingProfile && existingProfile.role !== "patient") {
      return jsonError(
        "Este email pertence a um perfil profissional.",
        409,
      );
    }

    const { error: upsertProfileError } = await adminClient.from("profiles").upsert({
      active: true,
      email: patientEmail,
      id: authUser.id,
      name: patient.name,
      role: "patient",
      updated_at: new Date().toISOString(),
      workspace_id: workspaceId,
    });

    if (upsertProfileError) {
      return jsonError("Nao foi possivel preparar o perfil do paciente.", 500, {
        errorMessage: upsertProfileError.message,
      });
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
      return jsonError("Nao foi possivel vincular o acesso ao paciente.", 500, {
        errorMessage: updatePatientError.message,
      });
    }

    const emailRedirectTo = getPatientRedirectUrl(request);
    const otpClient = createServerSupabaseClient();
    const { error: otpError } = await otpClient.auth.signInWithOtp({
      email: patientEmail,
      options: {
        emailRedirectTo,
        shouldCreateUser: false,
      },
    });

    if (otpError) {
      return jsonError("Nao foi possivel enviar o link de acesso.", 500, {
        errorMessage: otpError.message,
      });
    }

    return Response.json({
      message: "Link de acesso enviado para o paciente.",
    });
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "Nao foi possivel enviar o link de acesso.",
      500,
      { hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) },
    );
  }
}
