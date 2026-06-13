drop policy if exists "Admins can read workspace patients" on public.patients;
drop policy if exists "Admins can create workspace patients" on public.patients;
drop policy if exists "Admins can update workspace patients" on public.patients;

create policy "Admins can read workspace patients"
on public.patients
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and p.role in ('owner', 'admin')
      and p.workspace_id = patients.workspace_id
  )
);

create policy "Admins can create workspace patients"
on public.patients
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
      and p.workspace_id = patients.workspace_id
  )
);

create policy "Admins can update workspace patients"
on public.patients
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and p.role in ('owner', 'admin')
      and p.workspace_id = patients.workspace_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and p.role in ('owner', 'admin')
      and p.workspace_id = patients.workspace_id
  )
);

comment on policy "Admins can read workspace patients" on public.patients is
  'Owners e admins leem pacientes do proprio workspace.';
comment on policy "Admins can create workspace patients" on public.patients is
  'Owners e admins criam pacientes apenas no proprio workspace, vinculando professional_id ao usuario autenticado.';
comment on policy "Admins can update workspace patients" on public.patients is
  'Owners e admins atualizam dados basicos e active apenas em pacientes do proprio workspace.';
