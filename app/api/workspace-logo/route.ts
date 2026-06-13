import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/auth/roles";
import {
  toWorkspaceSettingsPayload,
  workspaceSettingsSchema,
} from "@/lib/workspaces/schema";

const LOGO_BUCKET = "workspace-logos";
const MAX_LOGO_SIZE = 5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/jpg"];

type ProfileForUpload = {
  active: boolean;
  id: string;
  role: UserRole;
  workspace_id: string | null;
};

function isDevelopment() {
  return process.env.NODE_ENV === "development";
}

function routeLog(step: string, details: Record<string, unknown>) {
  console.info("[workspace-logo-route]", {
    step,
    ...details,
  });
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

function getLogoExtension(file: File) {
  if (file.type === "image/png") {
    return "png";
  }

  return "jpg";
}

function validateLogoFile(file: File) {
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    return "Envie uma imagem PNG ou JPG.";
  }

  if (file.size > MAX_LOGO_SIZE) {
    return "A imagem deve ter no maximo 5MB.";
  }

  return null;
}

async function getAuthorizedProfile(request: Request) {
  const token = getBearerToken(request);

  routeLog("request-auth-header", {
    hasBearer: Boolean(token),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  });

  if (!token) {
    return {
      response: jsonError(
        "Sessao ausente. Entre novamente para enviar a logotipo.",
        401,
        { hasBearer: false },
      ),
    };
  }

  const authClient = createServerSupabaseClient();
  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(token);

  routeLog("token-validation", {
    errorMessage: userError?.message,
    userId: user?.id,
  });

  if (userError || !user) {
    return {
      response: jsonError(
        "Sessao invalida. Entre novamente para enviar a logotipo.",
        401,
        { errorMessage: userError?.message },
      ),
    };
  }

  const adminClient = createSupabaseAdminClient();
  const { data: profileData, error: profileError } = await adminClient
    .from("profiles")
    .select("id, workspace_id, role, active")
    .eq("id", user.id)
    .maybeSingle();

  routeLog("profile-lookup", {
    errorMessage: profileError?.message,
    profile: profileData,
  });

  if (profileError) {
    return {
      response: jsonError("Nao foi possivel validar seu perfil.", 500, {
        errorMessage: profileError.message,
      }),
    };
  }

  const profile = profileData as ProfileForUpload | null;

  if (!profile) {
    return {
      response: jsonError("Perfil nao encontrado. Fale com o administrador.", 403),
    };
  }

  if (!profile.active) {
    return {
      response: jsonError("Seu perfil esta inativo.", 403, {
        profileId: profile.id,
      }),
    };
  }

  if (profile.role !== "owner" && profile.role !== "admin") {
    return {
      response: jsonError("Voce nao tem permissao para alterar a logotipo.", 403, {
        role: profile.role,
      }),
    };
  }

  if (!profile.workspace_id) {
    return {
      response: jsonError("Ambiente nao encontrado para seu perfil.", 403, {
        profileId: profile.id,
      }),
    };
  }

  routeLog("authorization-ok", {
    profileId: profile.id,
    role: profile.role,
    workspaceId: profile.workspace_id,
  });

  return { adminClient, profile };
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthorizedProfile(request);

    if ("response" in auth) {
      return auth.response;
    }

    const { adminClient, profile } = auth;
    const workspaceId = profile.workspace_id;

    if (!workspaceId) {
      return jsonError("Ambiente nao encontrado para seu perfil.", 403);
    }

    const formData = await request.formData();
    const logo = formData.get("logo");

    if (!(logo instanceof File)) {
      return jsonError("Selecione uma imagem para enviar.");
    }

    const validationError = validateLogoFile(logo);

    if (validationError) {
      return jsonError(validationError);
    }

    const extension = getLogoExtension(logo);
    const path = `${workspaceId}/logo-${Date.now()}.${extension}`;
    const bytes = await logo.arrayBuffer();

    routeLog("storage-upload-start", {
      bucket: LOGO_BUCKET,
      fileSize: logo.size,
      fileType: logo.type,
      path,
      workspaceId,
    });

    const { error: uploadError } = await adminClient.storage
      .from(LOGO_BUCKET)
      .upload(path, bytes, {
        cacheControl: "3600",
        contentType: logo.type,
        upsert: true,
      });

    routeLog("storage-upload-result", {
      errorMessage: uploadError?.message,
      path,
    });

    if (uploadError) {
      return jsonError(uploadError.message, 500, {
        bucket: LOGO_BUCKET,
        path,
      });
    }

    const { data: publicUrlData } = adminClient.storage
      .from(LOGO_BUCKET)
      .getPublicUrl(path);

    const { data: workspaceData, error: workspaceError } = await adminClient
      .from("workspaces")
      .update({
        logo_url: publicUrlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", workspaceId)
      .select("id, name, logo_url")
      .single();

    routeLog("workspace-update-result", {
      errorMessage: workspaceError?.message,
      workspace: workspaceData,
      workspaceId,
    });

    if (workspaceError || !workspaceData) {
      return jsonError(
        "Logo enviada, mas nao foi possivel atualizar o ambiente.",
        500,
        { errorMessage: workspaceError?.message },
      );
    }

    return Response.json({
      workspace: workspaceData,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Nao foi possivel enviar a logotipo.";

    return jsonError(message, 500, {
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await getAuthorizedProfile(request);

    if ("response" in auth) {
      return auth.response;
    }

    const { adminClient, profile } = auth;
    const workspaceId = profile.workspace_id;

    if (!workspaceId) {
      return jsonError("Ambiente nao encontrado para seu perfil.", 403);
    }

    const body = (await request.json()) as unknown;
    const parsed = workspaceSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("Dados invalidos para salvar a identidade.", 400, {
        issues: parsed.error.issues,
      });
    }

    routeLog("workspace-settings-update-start", {
      logoUrl: parsed.data.logo_url,
      name: parsed.data.name,
      slug: parsed.data.slug,
      workspaceId,
    });

    const payload = toWorkspaceSettingsPayload(parsed.data);

    const { data: workspaceData, error: workspaceError } = await adminClient
      .from("workspaces")
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", workspaceId)
      .select()
      .single();

    routeLog("workspace-settings-update-result", {
      errorMessage: workspaceError?.message,
      workspace: workspaceData,
      workspaceId,
    });

    if (workspaceError || !workspaceData) {
      if (workspaceError?.code === "23505") {
        return jsonError(
          "Este slug ja esta em uso. Escolha outro link para o portal.",
          409,
          { errorMessage: workspaceError.message },
        );
      }

      return jsonError("Nao foi possivel salvar a identidade visual.", 500, {
        errorMessage: workspaceError?.message,
      });
    }

    return Response.json({
      workspace: workspaceData,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Nao foi possivel salvar a identidade visual.";

    return jsonError(message, 500, {
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    });
  }
}
