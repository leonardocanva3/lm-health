-- Production reset: Eliane Gonçalves workspace.
--
-- Purpose:
--   Prepare Eliane's workspace for real production use by removing all pilot
--   operational data and separating LM Health administrative users into their
--   own workspace.
--
-- Safety rules:
--   - Does not delete auth.users.
--   - Does not delete public.profiles.
--   - Does not delete public.workspaces.
--   - Deletes only appointments, patient_notes, patient_resources, and patients
--     whose workspace is exactly slug 'eliane-goncalves'.
--   - Moves profiles out of Eliane's workspace instead of deleting them.

begin;

do $$
begin
  if not exists (
    select 1 from public.workspaces where slug = 'eliane-goncalves'
  ) then
    raise exception 'Workspace slug eliane-goncalves not found. Reset aborted.';
  end if;

  if not exists (
    select 1
    from public.profiles
    where lower(email) = 'elianefg.psicologa@gmail.com'
  ) then
    raise exception 'Profile elianefg.psicologa@gmail.com not found. Reset aborted.';
  end if;
end $$;

create temp table cleanup_workspace_refs (
  key text primary key,
  id uuid not null
) on commit drop;

insert into public.workspaces (
  name,
  slug,
  specialty,
  plan,
  active,
  updated_at
)
values (
  'LM Health Administração',
  'lm-health-admin',
  'Administração',
  'admin',
  true,
  now()
)
on conflict (slug) do update
set
  name = excluded.name,
  specialty = excluded.specialty,
  active = true,
  updated_at = now();

insert into cleanup_workspace_refs (key, id)
select 'eliane', id
from public.workspaces
where slug = 'eliane-goncalves';

insert into cleanup_workspace_refs (key, id)
select 'admin', id
from public.workspaces
where slug = 'lm-health-admin';

update public.workspaces w
set
  name = 'Eliane Gonçalves',
  updated_at = now()
where w.id = (select id from cleanup_workspace_refs where key = 'eliane');

update public.profiles p
set
  workspace_id = (select id from cleanup_workspace_refs where key = 'admin'),
  role = 'owner',
  active = true,
  updated_at = now()
where lower(p.email) in (
    'admin@lmhealth.com.br',
    'leomachadolanding@gmail.com'
  );

update public.profiles p
set
  workspace_id = null,
  updated_at = now()
where p.workspace_id = (select id from cleanup_workspace_refs where key = 'eliane')
  and lower(p.email) <> 'elianefg.psicologa@gmail.com';

update public.profiles p
set
  workspace_id = (select id from cleanup_workspace_refs where key = 'eliane'),
  name = 'Eliane Gonçalves',
  role = 'owner',
  active = true,
  updated_at = now()
where lower(p.email) = 'elianefg.psicologa@gmail.com';

delete from public.appointments a
where a.workspace_id = (select id from cleanup_workspace_refs where key = 'eliane');

delete from public.patient_notes pn
where pn.workspace_id = (select id from cleanup_workspace_refs where key = 'eliane');

delete from public.patient_resources pr
where pr.workspace_id = (select id from cleanup_workspace_refs where key = 'eliane');

delete from public.patients p
where p.workspace_id = (select id from cleanup_workspace_refs where key = 'eliane');

commit;

-- Conferência: Workspace Eliane.
select
  w.id,
  w.name,
  w.slug,
  w.specialty,
  w.whatsapp,
  w.logo_url,
  w.primary_color,
  w.secondary_color,
  w.active,
  w.updated_at
from public.workspaces w
where w.slug = 'eliane-goncalves';

-- Conferência: owners, pacientes, consultas, recursos e orientações.
with eliane_workspace as (
  select id
  from public.workspaces
  where slug = 'eliane-goncalves'
)
select
  (
    select count(*)
    from public.profiles p
    join eliane_workspace ew on ew.id = p.workspace_id
    where p.role = 'owner'
      and lower(p.email) = 'elianefg.psicologa@gmail.com'
  ) as owners,
  (
    select count(*)
    from public.patients p
    join eliane_workspace ew on ew.id = p.workspace_id
  ) as pacientes,
  (
    select count(*)
    from public.appointments a
    join eliane_workspace ew on ew.id = a.workspace_id
  ) as consultas,
  (
    select count(*)
    from public.patient_resources pr
    join eliane_workspace ew on ew.id = pr.workspace_id
  ) as recursos,
  (
    select count(*)
    from public.patient_notes pn
    join eliane_workspace ew on ew.id = pn.workspace_id
  ) as orientacoes;

-- Conferência: profiles vinculados ao workspace da Eliane.
select
  p.id,
  p.name,
  p.email,
  p.role,
  p.active,
  p.updated_at
from public.profiles p
join public.workspaces w on w.id = p.workspace_id
where w.slug = 'eliane-goncalves'
order by p.role, p.email;

-- Conferência: workspace administrativo e owners movidos.
select
  w.id as workspace_id,
  w.name as workspace_name,
  w.slug,
  p.id as profile_id,
  p.name as profile_name,
  p.email,
  p.role,
  p.active
from public.workspaces w
left join public.profiles p on p.workspace_id = w.id
where w.slug = 'lm-health-admin'
  and (
    p.email is null
    or lower(p.email) in (
      'admin@lmhealth.com.br',
      'leomachadolanding@gmail.com'
    )
  )
order by p.email;
