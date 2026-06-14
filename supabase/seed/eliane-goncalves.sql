-- PILOT SEED ONLY: Eliane Gonçalves.
-- Do not run this file in production.
--
-- Purpose:
--   Create isolated pilot data for the Eliane Gonçalves patient area.
--
-- Before running:
--   1. Create these users in Supabase Auth with test/pilot-only passwords:
--      - eliane.goncalves@lmhealth.local
--      - paciente.eliane.teste@lmhealth.local
--   2. Confirm both emails or disable email confirmation in local/staging.
--   3. Run this SQL only against a local/staging/pilot database.
--
-- The script does not store or define passwords.
-- Keep passwords in the staging environment only.

begin;

do $$
begin
  if not exists (
    select 1 from auth.users where lower(email) = 'eliane.goncalves@lmhealth.local'
  ) then
    raise exception 'Missing Supabase Auth user: eliane.goncalves@lmhealth.local. Create it before running supabase/seed/eliane-goncalves.sql.';
  end if;

  if not exists (
    select 1 from auth.users where lower(email) = 'paciente.eliane.teste@lmhealth.local'
  ) then
    raise exception 'Missing Supabase Auth user: paciente.eliane.teste@lmhealth.local. Create it before running supabase/seed/eliane-goncalves.sql.';
  end if;
end $$;

with workspace_upsert as (
  insert into public.workspaces (
    name,
    slug,
    logo_url,
    primary_color,
    secondary_color,
    whatsapp,
    phone,
    instagram,
    site,
    address,
    city_state,
    business_hours,
    specialty,
    domain,
    plan,
    active,
    updated_at
  )
  values (
    'Eliane Gonçalves',
    'eliane-goncalves',
    'https://placehold.co/512x512/png?text=EG',
    '#7C5C52',
    '#253B3A',
    '5500000000000',
    '5500000000000',
    '@psicologaelianegoncalves',
    'https://www.psicologaelianegoncalves.com.br',
    null,
    null,
    'Atendimento online e presencial mediante agendamento',
    'Psicologia',
    null,
    'piloto',
    true,
    now()
  )
  on conflict (slug) do update
  set
    name = excluded.name,
    logo_url = excluded.logo_url,
    primary_color = excluded.primary_color,
    secondary_color = excluded.secondary_color,
    whatsapp = excluded.whatsapp,
    phone = excluded.phone,
    instagram = excluded.instagram,
    site = excluded.site,
    address = excluded.address,
    city_state = excluded.city_state,
    business_hours = excluded.business_hours,
    specialty = excluded.specialty,
    plan = excluded.plan,
    active = excluded.active,
    updated_at = now()
  returning id
),
admin_user as (
  select id, email
  from auth.users
  where lower(email) = 'eliane.goncalves@lmhealth.local'
  limit 1
),
patient_user as (
  select id, email
  from auth.users
  where lower(email) = 'paciente.eliane.teste@lmhealth.local'
  limit 1
),
admin_profile as (
  insert into public.profiles (
    id,
    workspace_id,
    name,
    email,
    role,
    active,
    updated_at
  )
  select
    admin_user.id,
    workspace_upsert.id,
    'Eliane Gonçalves',
    admin_user.email,
    'owner',
    true,
    now()
  from admin_user, workspace_upsert
  on conflict (id) do update
  set
    workspace_id = excluded.workspace_id,
    name = excluded.name,
    email = excluded.email,
    role = excluded.role,
    active = excluded.active,
    updated_at = now()
  returning id, workspace_id
),
patient_profile as (
  insert into public.profiles (
    id,
    workspace_id,
    name,
    email,
    role,
    active,
    updated_at
  )
  select
    patient_user.id,
    workspace_upsert.id,
    'Paciente Teste Eliane',
    patient_user.email,
    'patient',
    true,
    now()
  from patient_user, workspace_upsert
  on conflict (id) do update
  set
    workspace_id = excluded.workspace_id,
    name = excluded.name,
    email = excluded.email,
    role = excluded.role,
    active = excluded.active,
    updated_at = now()
  returning id, workspace_id
),
patient_row as (
  insert into public.patients (
    id,
    workspace_id,
    profile_id,
    professional_id,
    name,
    email,
    phone,
    birth_date,
    active,
    updated_at
  )
  select
    'a1111111-1111-4111-8111-111111111111',
    workspace_upsert.id,
    patient_profile.id,
    admin_profile.id,
    'Paciente Teste Eliane',
    'paciente.eliane.teste@lmhealth.local',
    '5500000000001',
    null,
    true,
    now()
  from workspace_upsert, admin_profile, patient_profile
  on conflict (id) do update
  set
    workspace_id = excluded.workspace_id,
    profile_id = excluded.profile_id,
    professional_id = excluded.professional_id,
    name = excluded.name,
    email = excluded.email,
    phone = excluded.phone,
    birth_date = excluded.birth_date,
    active = excluded.active,
    updated_at = now()
  returning id, workspace_id, professional_id
)
insert into public.appointments (
  id,
  workspace_id,
  patient_id,
  professional_id,
  scheduled_at,
  notes,
  status,
  updated_at
)
select
  'a2222222-2222-4222-8222-222222222222',
  patient_row.workspace_id,
  patient_row.id,
  patient_row.professional_id,
  now() + interval '7 days',
  'Consulta futura de teste do piloto Eliane',
  'scheduled',
  now()
from patient_row
on conflict (id) do update
set
  workspace_id = excluded.workspace_id,
  patient_id = excluded.patient_id,
  professional_id = excluded.professional_id,
  scheduled_at = excluded.scheduled_at,
  notes = excluded.notes,
  status = excluded.status,
  updated_at = now();

with workspace_ref as (
  select id from public.workspaces where slug = 'eliane-goncalves' limit 1
),
admin_ref as (
  select id from public.profiles where email = 'eliane.goncalves@lmhealth.local' limit 1
),
patient_ref as (
  select id from public.patients where email = 'paciente.eliane.teste@lmhealth.local' limit 1
)
insert into public.patient_notes (
  id,
  workspace_id,
  patient_id,
  professional_id,
  title,
  content,
  emoji,
  active,
  updated_at
)
select
  note.id,
  workspace_ref.id,
  patient_ref.id,
  admin_ref.id,
  note.title,
  note.content,
  note.emoji,
  note.active,
  now()
from workspace_ref, admin_ref, patient_ref,
  (values
    (
      'a3333333-3333-4333-8333-333333333333'::uuid,
      'Orientacao ativa do piloto',
      'Mensagem ativa de teste para validar a area do paciente da Eliane.',
      'OK',
      true
    ),
    (
      'a4444444-4444-4444-8444-444444444444'::uuid,
      'Orientacao inativa do piloto',
      'Mensagem inativa de teste que nao deve aparecer para o paciente.',
      'OFF',
      false
    )
  ) as note(id, title, content, emoji, active)
on conflict (id) do update
set
  workspace_id = excluded.workspace_id,
  patient_id = excluded.patient_id,
  professional_id = excluded.professional_id,
  title = excluded.title,
  content = excluded.content,
  emoji = excluded.emoji,
  active = excluded.active,
  updated_at = now();

with workspace_ref as (
  select id from public.workspaces where slug = 'eliane-goncalves' limit 1
),
admin_ref as (
  select id from public.profiles where email = 'eliane.goncalves@lmhealth.local' limit 1
),
patient_ref as (
  select id from public.patients where email = 'paciente.eliane.teste@lmhealth.local' limit 1
)
insert into public.patient_resources (
  id,
  workspace_id,
  patient_id,
  professional_id,
  type,
  title,
  description,
  url,
  storage_path,
  filename,
  mime_type,
  emoji,
  active,
  updated_at
)
select
  resource.id,
  workspace_ref.id,
  patient_ref.id,
  admin_ref.id,
  resource.type,
  resource.title,
  resource.description,
  resource.url,
  null,
  null,
  null,
  resource.emoji,
  resource.active,
  now()
from workspace_ref, admin_ref, patient_ref,
  (values
    (
      'a5555555-5555-4555-8555-555555555555'::uuid,
      'document',
      'Recurso ativo do piloto',
      'Material ativo de teste para validar a area do paciente da Eliane.',
      'https://example.com/material-ativo-piloto-eliane.pdf',
      'OK',
      true
    ),
    (
      'a6666666-6666-4666-8666-666666666666'::uuid,
      'document',
      'Recurso inativo do piloto',
      'Material inativo de teste que nao deve aparecer para o paciente.',
      'https://example.com/material-inativo-piloto-eliane.pdf',
      'OFF',
      false
    )
  ) as resource(id, type, title, description, url, emoji, active)
on conflict (id) do update
set
  workspace_id = excluded.workspace_id,
  patient_id = excluded.patient_id,
  professional_id = excluded.professional_id,
  type = excluded.type,
  title = excluded.title,
  description = excluded.description,
  url = excluded.url,
  storage_path = excluded.storage_path,
  filename = excluded.filename,
  mime_type = excluded.mime_type,
  emoji = excluded.emoji,
  active = excluded.active,
  updated_at = now();

commit;
