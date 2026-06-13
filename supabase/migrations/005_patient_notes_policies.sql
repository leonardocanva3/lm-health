drop policy if exists "Admins can read workspace patient notes" on public.patient_notes;
drop policy if exists "Admins can create workspace patient notes" on public.patient_notes;
drop policy if exists "Admins can update workspace patient notes" on public.patient_notes;
drop policy if exists "Patients can read own active patient notes" on public.patient_notes;

create policy "Admins can read workspace patient notes"
on public.patient_notes
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and p.role in ('owner', 'admin')
      and p.workspace_id = patient_notes.workspace_id
  )
);

create policy "Admins can create workspace patient notes"
on public.patient_notes
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
      and p.workspace_id = patient_notes.workspace_id
  )
  and exists (
    select 1
    from public.patients pt
    where pt.id = patient_notes.patient_id
      and pt.workspace_id = patient_notes.workspace_id
  )
);

create policy "Admins can update workspace patient notes"
on public.patient_notes
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and p.role in ('owner', 'admin')
      and p.workspace_id = patient_notes.workspace_id
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and p.role in ('owner', 'admin')
      and p.workspace_id = patient_notes.workspace_id
  )
  and exists (
    select 1
    from public.patients pt
    where pt.id = patient_notes.patient_id
      and pt.workspace_id = patient_notes.workspace_id
  )
);

create policy "Patients can read own active patient notes"
on public.patient_notes
for select
to authenticated
using (
  active = true
  and exists (
    select 1
    from public.patients pt
    where pt.id = patient_notes.patient_id
      and pt.active = true
      and pt.profile_id = auth.uid()
  )
);

comment on policy "Admins can read workspace patient notes" on public.patient_notes is
  'Owners e admins leem orientacoes do proprio workspace.';
comment on policy "Admins can create workspace patient notes" on public.patient_notes is
  'Owners e admins criam orientacoes apenas no proprio workspace.';
comment on policy "Admins can update workspace patient notes" on public.patient_notes is
  'Owners e admins editam dados e active de orientacoes do proprio workspace.';
comment on policy "Patients can read own active patient notes" on public.patient_notes is
  'Pacientes leem apenas orientacoes ativas vinculadas ao seu patient_id.';
