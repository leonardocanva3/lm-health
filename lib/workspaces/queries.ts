import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type WorkspaceRow = Database["public"]["Tables"]["workspaces"]["Row"];

export type WorkspaceIdentity = {
  address: string | null;
  businessHours: string | null;
  cityState: string | null;
  id: string;
  instagram: string | null;
  name: string;
  logoUrl: string | null;
  phone: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  site: string | null;
  slug: string;
  specialty: string | null;
  whatsapp: string | null;
};

export function getWorkspaceInitials(name?: string | null) {
  if (!name?.trim()) {
    return "MP";
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function mapWorkspaceIdentity(data: WorkspaceRow): WorkspaceIdentity {
  return {
    address: data.address,
    businessHours: data.business_hours,
    cityState: data.city_state,
    id: data.id,
    instagram: data.instagram,
    name: data.name,
    logoUrl: data.logo_url,
    phone: data.phone,
    primaryColor: data.primary_color,
    secondaryColor: data.secondary_color,
    site: data.site,
    slug: data.slug,
    specialty: data.specialty,
    whatsapp: data.whatsapp,
  };
}

export async function getWorkspaceById(
  workspaceId: string,
): Promise<WorkspaceIdentity | null> {
  const supabase = createBrowserSupabaseClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapWorkspaceIdentity(data);
}
