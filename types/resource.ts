export const RESOURCE_TYPES = [
  "pdf",
  "youtube",
  "spotify",
  "image",
  "file",
  "spreadsheet",
  "document",
  "other",
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

export type PatientResource = {
  id: string;
  workspaceId: string;
  patientId: string;
  professionalId: string;
  type: ResourceType;
  title: string;
  description: string | null;
  url: string | null;
  storagePath: string | null;
  filename: string | null;
  mimeType: string | null;
  emoji: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
