-- Diagnostico para upload de logotipo no bucket workspace-logos.
-- Preencha os valores abaixo antes de executar no Supabase SQL Editor.
-- Observacao: no SQL Editor, auth.uid() pode retornar null por nao haver JWT de usuario.

with input as (
  select
    '<USER_ID_DO_AUTH>'::uuid as user_id,
    '<WORKSPACE_ID_DO_PROFILE>'::text as workspace_id,
    '<WORKSPACE_ID_DO_PROFILE>/logo-teste.png'::text as object_name
),
profile_check as (
  select
    auth.uid() as auth_uid,
    p.id as profile_id,
    p.workspace_id,
    p.role,
    p.active,
    i.object_name,
    (storage.foldername(i.object_name))[1] as first_folder,
    p.workspace_id::text = (storage.foldername(i.object_name))[1] as workspace_matches_path,
    p.id = i.user_id as profile_matches_user_id,
    p.active = true as profile_is_active,
    p.role in ('owner', 'admin') as profile_is_admin
  from input i
  left join public.profiles p on p.id = i.user_id
)
select
  *,
  (
    profile_matches_user_id
    and profile_is_active
    and profile_is_admin
    and workspace_matches_path
  ) as policy_should_allow_upload
from profile_check;
