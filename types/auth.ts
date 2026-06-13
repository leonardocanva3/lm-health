import type { UserRole } from "@/lib/auth/roles";

export type AuthProfile = {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
};
