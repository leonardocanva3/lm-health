export type Workspace = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  whatsapp: string | null;
  domain: string | null;
  plan: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};
