import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  workspaceSettingsSchema,
  type WorkspaceSettingsValues,
} from "@/lib/workspaces/schema";
import type { Database } from "@/types/database";

type WorkspaceRow = Database["public"]["Tables"]["workspaces"]["Row"];

type WorkspaceSettingsResponse =
  | { workspace: WorkspaceRow }
  | { details?: unknown; error?: string };

export async function updateWorkspaceSettings(
  workspaceId: string,
  values: WorkspaceSettingsValues,
): Promise<WorkspaceRow> {
  const payload = workspaceSettingsSchema.parse(values);
  const supabase = createBrowserSupabaseClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error(
      sessionError?.message ??
        "Sessao ausente. Entre novamente para salvar a identidade.",
    );
  }

  const response = await fetch("/api/workspace-logo", {
    body: JSON.stringify(payload),
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    method: "PATCH",
  });
  const result = (await response.json()) as WorkspaceSettingsResponse;

  if (!response.ok || !("workspace" in result)) {
    console.error("[workspace-settings-save:error]", {
      body: result,
      responseStatus: response.status,
      workspaceId,
    });

    throw new Error(
      "error" in result && result.error
        ? result.error
        : "Nao foi possivel salvar a identidade visual.",
    );
  }

  if (result.workspace.id !== workspaceId) {
    throw new Error("Workspace retornado nao confere com o perfil autenticado.");
  }

  return result.workspace;
}
