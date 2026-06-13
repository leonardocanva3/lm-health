drop policy if exists "Admins can read workspace appointments" on public.appointments;
drop policy if exists "Admins can create workspace appointments" on public.appointments;
drop policy if exists "Admins can update workspace appointments" on public.appointments;
drop policy if exists "Patients can read own appointments" on public.appointments;
drop policy if exists "Patients can read own patient row" on public.patients;

create policy "Admins can read workspace appointments"
on public.appointments
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and p.role in ('owner', 'admin')
      and p.workspace_id = appointments.workspace_id
  )
);

create policy "Admins can create workspace appointments"
on public.appointments
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
      and p.workspace_id = appointments.workspace_id
  )
);

create policy "Admins can update workspace appointments"
on public.appointments
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and p.role in ('owner', 'admin')
      and p.workspace_id = appointments.workspace_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and p.role in ('owner', 'admin')
      and p.workspace_id = appointments.workspace_id
  )
);

create policy "Patients can read own appointments"
on public.appointments
for select
to authenticated
using (
  exists (
    select 1
    from public.patients pt
    where pt.id = appointments.patient_id
      and pt.active = true
      and pt.profile_id = auth.uid()
  )
);

create policy "Patients can read own patient row"
on public.patients
for select
to authenticated
using (
  profile_id = auth.uid()
  and active = true
);

comment on policy "Admins can read workspace appointments" on public.appointments is
  'Owners e admins leem consultas do proprio workspace.';
comment on policy "Admins can create workspace appointments" on public.appointments is
  'Owners e admins criam consultas apenas no proprio workspace.';
comment on policy "Admins can update workspace appointments" on public.appointments is
  'Owners e admins editam status e dados de consultas do proprio workspace.';
comment on policy "Patients can read own appointments" on public.appointments is
  'Pacientes leem apenas consultas vinculadas ao patient_id que aponta para seu profile.';
comment on policy "Patients can read own patient row" on public.patients is
  'Pacientes leem apenas o proprio registro de patient ativo para resolver vinculo.';
