import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { WorkspaceIdentity } from "@/lib/workspaces/queries";

export type PublicWorkspace = WorkspaceIdentity;

export async function getPublicWorkspaceBySlug(
  slug: string,
): Promise<PublicWorkspace | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select(
      "id, name, slug, logo_url, primary_color, secondary_color, whatsapp, phone, instagram, site, address, city_state, business_hours, specialty",
    )
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    address: data.address,
    businessHours: data.business_hours,
    cityState: data.city_state,
    id: data.id,
    instagram: data.instagram,
    logoUrl: data.logo_url,
    name: data.name,
    phone: data.phone,
    primaryColor: data.primary_color,
    secondaryColor: data.secondary_color,
    site: data.site,
    slug: data.slug,
    specialty: data.specialty,
    whatsapp: data.whatsapp,
  };
}
