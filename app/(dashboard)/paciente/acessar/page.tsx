import { redirect } from "next/navigation";

import {
  ensurePatientAuthAccess,
  getPatientRedirectUrl,
  hashPatientAccessToken,
  type PatientAccessPatient,
} from "@/lib/patient-access/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AccessTokenRow = {
  expires_at: string;
  id: string;
  patient_id: string;
  used_at: string | null;
  workspace_id: string;
};

function getTokenValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

export default async function PatientAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const token = getTokenValue((await searchParams).token);

  if (!token) {
    redirect("/entrar");
  }

  const adminClient = createSupabaseAdminClient();
  const tokenHash = hashPatientAccessToken(token);
  const { data: tokenData, error: tokenError } = await adminClient
    .from("patient_access_tokens")
    .select("id, workspace_id, patient_id, token_hash, expires_at, used_at, created_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (tokenError || !tokenData) {
    redirect("/entrar");
  }

  const accessToken = tokenData as AccessTokenRow;

  if (accessToken.used_at || new Date(accessToken.expires_at) <= new Date()) {
    redirect("/entrar");
  }

  const { data: patientData, error: patientError } = await adminClient
    .from("patients")
    .select("id, workspace_id, profile_id, name, email, phone, active")
    .eq("id", accessToken.patient_id)
    .eq("workspace_id", accessToken.workspace_id)
    .maybeSingle();

  if (patientError || !patientData) {
    redirect("/entrar");
  }

  const patient = patientData as PatientAccessPatient;

  if (!patient.active) {
    redirect("/entrar");
  }

  const { email } = await ensurePatientAuthAccess({
    adminClient,
    patient,
    workspaceId: accessToken.workspace_id,
  });

  const { data: linkData, error: linkError } =
    await adminClient.auth.admin.generateLink({
      email,
      options: {
        redirectTo: getPatientRedirectUrl(),
      },
      type: "magiclink",
    });

  if (linkError || !linkData.properties?.action_link) {
    redirect("/entrar");
  }

  await adminClient
    .from("patient_access_tokens")
    .update({ used_at: new Date().toISOString() })
    .eq("id", accessToken.id)
    .is("used_at", null);

  redirect(linkData.properties.action_link);
}
