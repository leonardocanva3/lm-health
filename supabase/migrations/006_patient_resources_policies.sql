drop policy if exists "Admins can read workspace patient resources" on public.patient_resources;
drop policy if exists "Admins can create workspace patient resources" on public.patient_resources;
drop policy if exists "Admins can update workspace patient resources" on public.patient_resources;
drop policy if exists "Patients can read own active patient resources" on public.patient_resources;

create policy "Admins can read workspace patient resources"
on public.patient_resources
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and p.role in ('owner', 'admin')
      and p.workspace_id = patient_resources.workspace_id
  )
);

create policy "Admins can create workspace patient resources"
on public.patient_resources
for insert
to authenticated
with check (
  professional_id = auth.uid()
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and p.role in ('owner', 'admin')
      and p.workspace_id = patient_resources.workspace_id
  )
  and exists (
    select 1
    from public.patients pt
    where pt.id = patient_resources.patient_id
      and pt.workspace_id = patient_resources.workspace_id
  )
);

create policy "Admins can update workspace patient resources"
on public.patient_resources
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and p.role in ('owner', 'admin')
      and p.workspace_id = patient_resources.workspace_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and p.role in ('owner', 'admin')
      and p.workspace_id = patient_resources.workspace_id
  )
  and exists (
    select 1
    from public.patients pt
    where pt.id = patient_resources.patient_id
      and pt.workspace_id = patient_resources.workspace_id
  )
);

create policy "Patients can read own active patient resources"
on public.patient_resources
for select
to authenticated
using (
  active = true
  and exists (
    select 1
    from public.patients pt
    where pt.id = patient_resources.patient_id
      and pt.active = true
      and pt.profile_id = auth.uid()
  )
);

comment on policy "Admins can read workspace patient resources" on public.patient_resources is
  'Owners e admins leem recursos do proprio workspace.';
comment on policy "Admins can create workspace patient resources" on public.patient_resources is
  'Owners e admins criam recursos apenas para pacientes do proprio workspace.';
comment on policy "Admins can update workspace patient resources" on public.patient_resources is
  'Owners e admins editam dados e active de recursos do proprio workspace.';
comment on policy "Patients can read own active patient resources" on public.patient_resources is
  'Pacientes leem apenas recursos ativos vinculados ao seu patient_id.';
