import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const MAX_LOGO_SIZE = 5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/jpg"];

type WorkspaceLogoUploadResponse = {
  workspace: {
    id: string;
    logo_url: string | null;
    name: string;
  };
};

export function validateWorkspaceLogoFile(file: File) {
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    throw new Error("Envie uma imagem PNG ou JPG.");
  }

  if (file.size > MAX_LOGO_SIZE) {
    throw new Error("A imagem deve ter no maximo 5MB.");
  }
}

export async function uploadWorkspaceLogo(file: File) {
  validateWorkspaceLogoFile(file);

  const supabase = createBrowserSupabaseClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error(
      sessionError?.message ??
        "Sessao ausente. Entre novamente para enviar a logotipo.",
    );
  }

  const formData = new FormData();
  formData.append("logo", file);

  const response = await fetch("/api/workspace-logo", {
    body: formData,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    method: "POST",
  });
  const result = (await response.json()) as
    | WorkspaceLogoUploadResponse
    | { error?: string };

  if (!response.ok || !("workspace" in result)) {
    console.error("[workspace-logo-api:error]", {
      body: result,
      error: "error" in result ? result.error : undefined,
      responseStatus: response.status,
    });

    throw new Error(
      "error" in result && result.error
        ? result.error
        : "Nao foi possivel enviar a logotipo.",
    );
  }

  return result.workspace;
}
