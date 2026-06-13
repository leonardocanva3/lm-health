export type WorkspacePublicationInput = {
  logoUrl?: string | null;
  name?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  slug?: string | null;
  specialty?: string | null;
  whatsapp?: string | null;
};

export type WorkspacePublicationChecklistItem = {
  id:
    | "slug"
    | "logo"
    | "name"
    | "specialty"
    | "whatsapp"
    | "primaryColor"
    | "secondaryColor";
  isComplete: boolean;
  label: string;
};

export function getWorkspacePublicationStatus(
  workspace: WorkspacePublicationInput,
) {
  const checklistItems: WorkspacePublicationChecklistItem[] = [
    {
      id: "slug",
      isComplete: Boolean(workspace.slug?.trim()),
      label: "Slug preenchido",
    },
    {
      id: "logo",
      isComplete: Boolean(workspace.logoUrl?.trim()),
      label: "Logo cadastrada",
    },
    {
      id: "name",
      isComplete: Boolean(workspace.name?.trim()),
      label: "Nome preenchido",
    },
    {
      id: "specialty",
      isComplete: Boolean(workspace.specialty?.trim()),
      label: "Especialidade preenchida",
    },
    {
      id: "whatsapp",
      isComplete: Boolean(workspace.whatsapp?.trim()),
      label: "WhatsApp preenchido",
    },
    {
      id: "primaryColor",
      isComplete: Boolean(workspace.primaryColor?.trim()),
      label: "Cor principal definida",
    },
    {
      id: "secondaryColor",
      isComplete: Boolean(workspace.secondaryColor?.trim()),
      label: "Cor secundaria definida",
    },
  ];
  const isPublished = checklistItems.every((item) => item.isComplete);

  return {
    checklistItems,
    completedCount: checklistItems.filter((item) => item.isComplete).length,
    isPublished,
    totalCount: checklistItems.length,
  };
}
