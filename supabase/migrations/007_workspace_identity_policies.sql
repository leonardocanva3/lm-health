alter table public.workspaces
  add column if not exists name text;

update public.workspaces
set name = 'Workspace'
where name is null or btrim(name) = '';

alter table public.workspaces
  alter column name set not null;

alter table public.workspaces
  add column if not exists logo_url text;

alter table public.workspaces
  add column if not exists updated_at timestamp with time zone default now();

drop policy if exists "Workspace members can read workspace identity" on public.workspaces;
drop policy if exists "Admins can update workspace identity" on public.workspaces;

create policy "Workspace members can read workspace identity"
on public.workspaces
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = workspaces.id
      and p.active = true
  )
);

create policy "Admins can update workspace identity"
on public.workspaces
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = workspaces.id
      and p.role in ('owner', 'admin')
      and p.active = true
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.workspace_id = workspaces.id
      and p.role in ('owner', 'admin')
      and p.active = true
  )
);

comment on policy "Workspace members can read workspace identity" on public.workspaces is
  'Permite que usuarios autenticados leiam nome e logo do proprio workspace para renderizar a identidade visual.';

comment on policy "Admins can update workspace identity" on public.workspaces is
  'Permite que owner/admin atualizem nome e logo_url do proprio workspace.';
