-- STAGING/TEST ONLY.
-- Do not run this file in production.
--
-- Purpose:
--   Create deterministic commercial/test data for authenticated E2E validation.
--
-- Before running:
--   1. Create these users in Supabase Auth with test-only passwords:
--      - admin.teste@lmhealth.local
--      - paciente.teste@lmhealth.local
--   2. Confirm both emails or disable email confirmation in the local/staging project.
--   3. Run this SQL against the local/staging database only.
--
-- The script does not store or define passwords. Passwords must live in the
-- environment used by Playwright, never in git.

begin;

do $$
begin
  if not exists (
    select 1 from auth.users where lower(email) = 'admin.teste@lmhealth.local'
  ) then
    raise exception 'Missing Supabase Auth user: admin.teste@lmhealth.local. Create it before running supabase/seed/staging.sql.';
  end if;

  if not exists (
    select 1 from auth.users where lower(email) = 'paciente.teste@lmhealth.local'
  ) then
    raise exception 'Missing Supabase Auth user: paciente.teste@lmhealth.local. Create it before running supabase/seed/staging.sql.';
  end if;
end $$;

with workspace_upsert as (
  insert into public.workspaces (
    id,
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
    '11111111-1111-1111-1111-111111111111',
    'Clinica Modelo',
    'clinica-modelo',
    'https://placehold.co/512x512/png?text=CM',
    '#047857',
    '#0f172a',
    '5599999999999',
    '5599999999999',
    '@clinica.modelo',
    'https://clinica-modelo.local',
    'Rua de Teste, 123 - Sala 45',
    'Sao Paulo/SP',
    'Segunda a sexta, 8h as 18h',
    'Psicologia',
    null,
    'starter',
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
  where lower(email) = 'admin.teste@lmhealth.local'
  limit 1
),
patient_user as (
  select id, email
  from auth.users
  where lower(email) = 'paciente.teste@lmhealth.local'
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
    'Admin Teste',
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
    'Joao da Silva',
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
    '33333333-3333-3333-3333-333333333333',
    workspace_upsert.id,
    patient_profile.id,
    admin_profile.id,
    'Joao da Silva',
    'paciente.teste@lmhealth.local',
    '5598888888888',
    '1990-05-20',
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
  '44444444-4444-4444-4444-444444444444',
  patient_row.workspace_id,
  patient_row.id,
  patient_row.professional_id,
  now() + interval '2 days',
  'Consulta de teste E2E',
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
  select id from public.workspaces where slug = 'clinica-modelo' limit 1
),
admin_ref as (
  select id from public.profiles where email = 'admin.teste@lmhealth.local' limit 1
),
patient_ref as (
  select id from public.patients where email = 'paciente.teste@lmhealth.local' limit 1
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
      '55555555-5555-5555-5555-555555555555'::uuid,
      'Orientacao ativa de teste',
      'Conteudo ativo visivel para validar a area do paciente.',
      'OK',
      true
    ),
    (
      '66666666-6666-6666-6666-666666666666'::uuid,
      'Orientacao inativa de teste',
      'Conteudo inativo que nao deve aparecer para o paciente.',
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
  select id from public.workspaces where slug = 'clinica-modelo' limit 1
),
admin_ref as (
  select id from public.profiles where email = 'admin.teste@lmhealth.local' limit 1
),
patient_ref as (
  select id from public.patients where email = 'paciente.teste@lmhealth.local' limit 1
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
      '77777777-7777-7777-7777-777777777777'::uuid,
      'youtube',
      'Recurso ativo de teste',
      'Material ativo visivel para validar a area do paciente.',
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'OK',
      true
    ),
    (
      '88888888-8888-8888-8888-888888888888'::uuid,
      'document',
      'Recurso inativo de teste',
      'Material inativo que nao deve aparecer para o paciente.',
      'https://example.com/recurso-inativo.pdf',
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
