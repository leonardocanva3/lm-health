export type Patient = {
  id: string;
  workspaceId: string;
  profileId: string | null;
  professionalId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
