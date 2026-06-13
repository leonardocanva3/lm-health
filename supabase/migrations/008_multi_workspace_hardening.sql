create or replace function public.lmh_current_workspace_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.workspace_id
  from public.profiles p
  where p.id = auth.uid()
    and p.active = true
  limit 1
$$;

create or replace function public.lmh_current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
    and p.active = true
  limit 1
$$;

create or replace function public.lmh_is_workspace_admin(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and p.role in ('owner', 'admin')
      and p.workspace_id = target_workspace_id
  )
$$;

create or replace function public.lmh_is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and p.workspace_id = target_workspace_id
  )
$$;

create or replace function public.lmh_patient_belongs_to_workspace(
  target_patient_id uuid,
  target_workspace_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.patients pt
    where pt.id = target_patient_id
      and pt.workspace_id = target_workspace_id
  )
$$;

create or replace function public.lmh_patient_profile_belongs_to_workspace(
  target_profile_id uuid,
  target_workspace_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_profile_id is null
    or exists (
      select 1
      from public.profiles p
      where p.id = target_profile_id
        and p.workspace_id = target_workspace_id
        and p.role = 'patient'
        and p.active = true
    )
$$;

create or replace function public.lmh_is_own_patient(target_patient_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.patients pt
    where pt.id = target_patient_id
      and pt.profile_id = auth.uid()
      and pt.active = true
  )
$$;

drop policy if exists "Users can read own active profile" on public.profiles;
drop policy if exists "Users can read own profile" on public.profiles;
drop policy if exists "Admins can read workspace profiles" on public.profiles;

create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  and active = true
);

create policy "Admins can read workspace profiles"
on public.profiles
for select
to authenticated
using (
  public.lmh_is_workspace_admin(workspace_id)
);

drop policy if exists "Workspace members can read workspace identity" on public.workspaces;
drop policy if exists "Admins can update workspace identity" on public.workspaces;
drop policy if exists "Workspace members can read own workspace" on public.workspaces;
drop policy if exists "Admins can update own workspace" on public.workspaces;

create policy "Workspace members can read own workspace"
on public.workspaces
for select
to authenticated
using (
  public.lmh_is_workspace_member(id)
);

create policy "Admins can update own workspace"
on public.workspaces
for update
to authenticated
using (
  public.lmh_is_workspace_admin(id)
)
with check (
  public.lmh_is_workspace_admin(id)
);

drop policy if exists "Admins can read workspace patients" on public.patients;
drop policy if exists "Admins can create workspace patients" on public.patients;
drop policy if exists "Admins can update workspace patients" on public.patients;
drop policy if exists "Patients can read own patient row" on public.patients;
drop policy if exists "Admins can delete workspace patients" on public.patients;

create policy "Admins can read workspace patients"
on public.patients
for select
to authenticated
using (
  public.lmh_is_workspace_admin(workspace_id)
);

create policy "Patients can read own patient row"
on public.patients
for select
to authenticated
using (
  profile_id = auth.uid()
  and active = true
);

create policy "Admins can create workspace patients"
on public.patients
for insert
to authenticated
with check (
  professional_id = auth.uid()
  and public.lmh_is_workspace_admin(workspace_id)
  and public.lmh_patient_profile_belongs_to_workspace(profile_id, workspace_id)
);

create policy "Admins can update workspace patients"
on public.patients
for update
to authenticated
using (
  public.lmh_is_workspace_admin(workspace_id)
)
with check (
  public.lmh_is_workspace_admin(workspace_id)
  and public.lmh_patient_profile_belongs_to_workspace(profile_id, workspace_id)
);

create policy "Admins can delete workspace patients"
on public.patients
for delete
to authenticated
using (
  public.lmh_is_workspace_admin(workspace_id)
);

drop policy if exists "Admins can read workspace appointments" on public.appointments;
drop policy if exists "Admins can create workspace appointments" on public.appointments;
drop policy if exists "Admins can update workspace appointments" on public.appointments;
drop policy if exists "Patients can read own appointments" on public.appointments;
drop policy if exists "Admins can delete workspace appointments" on public.appointments;

create policy "Admins can read workspace appointments"
on public.appointments
for select
to authenticated
using (
  public.lmh_is_workspace_admin(workspace_id)
);

create policy "Patients can read own appointments"
on public.appointments
for select
to authenticated
using (
  public.lmh_is_own_patient(patient_id)
);

create policy "Admins can create workspace appointments"
on public.appointments
for insert
to authenticated
with check (
  professional_id = auth.uid()
  and public.lmh_is_workspace_admin(workspace_id)
  and public.lmh_patient_belongs_to_workspace(patient_id, workspace_id)
);

create policy "Admins can update workspace appointments"
on public.appointments
for update
to authenticated
using (
  public.lmh_is_workspace_admin(workspace_id)
)
with check (
  public.lmh_is_workspace_admin(workspace_id)
  and public.lmh_patient_belongs_to_workspace(patient_id, workspace_id)
);

create policy "Admins can delete workspace appointments"
on public.appointments
for delete
to authenticated
using (
  public.lmh_is_workspace_admin(workspace_id)
);

drop policy if exists "Admins can read workspace patient notes" on public.patient_notes;
drop policy if exists "Admins can create workspace patient notes" on public.patient_notes;
drop policy if exists "Admins can update workspace patient notes" on public.patient_notes;
drop policy if exists "Patients can read own active patient notes" on public.patient_notes;
drop policy if exists "Admins can delete workspace patient notes" on public.patient_notes;

create policy "Admins can read workspace patient notes"
on public.patient_notes
for select
to authenticated
using (
  public.lmh_is_workspace_admin(workspace_id)
);

create policy "Patients can read own active patient notes"
on public.patient_notes
for select
to authenticated
using (
  active = true
  and public.lmh_is_own_patient(patient_id)
);

create policy "Admins can create workspace patient notes"
on public.patient_notes
for insert
to authenticated
with check (
  professional_id = auth.uid()
  and public.lmh_is_workspace_admin(workspace_id)
  and public.lmh_patient_belongs_to_workspace(patient_id, workspace_id)
);

create policy "Admins can update workspace patient notes"
on public.patient_notes
for update
to authenticated
using (
  public.lmh_is_workspace_admin(workspace_id)
)
with check (
  public.lmh_is_workspace_admin(workspace_id)
  and public.lmh_patient_belongs_to_workspace(patient_id, workspace_id)
);

create policy "Admins can delete workspace patient notes"
on public.patient_notes
for delete
to authenticated
using (
  public.lmh_is_workspace_admin(workspace_id)
);

drop policy if exists "Admins can read workspace patient resources" on public.patient_resources;
drop policy if exists "Admins can create workspace patient resources" on public.patient_resources;
drop policy if exists "Admins can update workspace patient resources" on public.patient_resources;
drop policy if exists "Patients can read own active patient resources" on public.patient_resources;
drop policy if exists "Admins can delete workspace patient resources" on public.patient_resources;

create policy "Admins can read workspace patient resources"
on public.patient_resources
for select
to authenticated
using (
  public.lmh_is_workspace_admin(workspace_id)
);

create policy "Patients can read own active patient resources"
on public.patient_resources
for select
to authenticated
using (
  active = true
  and public.lmh_is_own_patient(patient_id)
);

create policy "Admins can create workspace patient resources"
on public.patient_resources
for insert
to authenticated
with check (
  professional_id = auth.uid()
  and public.lmh_is_workspace_admin(workspace_id)
  and public.lmh_patient_belongs_to_workspace(patient_id, workspace_id)
);

create policy "Admins can update workspace patient resources"
on public.patient_resources
for update
to authenticated
using (
  public.lmh_is_workspace_admin(workspace_id)
)
with check (
  public.lmh_is_workspace_admin(workspace_id)
  and public.lmh_patient_belongs_to_workspace(patient_id, workspace_id)
);

create policy "Admins can delete workspace patient resources"
on public.patient_resources
for delete
to authenticated
using (
  public.lmh_is_workspace_admin(workspace_id)
);

comment on function public.lmh_current_workspace_id() is
  'Retorna o workspace_id do profile ativo do usuario autenticado para policies multi-workspace.';
comment on function public.lmh_is_workspace_admin(uuid) is
  'Valida se o usuario autenticado e owner/admin ativo do workspace informado.';
comment on function public.lmh_is_own_patient(uuid) is
  'Valida se o patient_id pertence ao profile autenticado.';
