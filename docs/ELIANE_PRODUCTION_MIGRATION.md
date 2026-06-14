# Aplicar migration 014 no Supabase Production

O push para GitHub/Vercel publica o app, mas nao aplica migrations no banco
Supabase. Antes de entregar o piloto da Eliane, aplique a migration abaixo no
SQL Editor do projeto Supabase Production.

Arquivo de origem:

```txt
supabase/migrations/014_workspace_policy_repair.sql
```

SQL:

```sql
drop policy if exists "Workspace members can read own workspace" on public.workspaces;
drop policy if exists "Admins can update own workspace" on public.workspaces;
drop policy if exists "Workspace members can read workspace identity" on public.workspaces;
drop policy if exists "Admins can update workspace identity" on public.workspaces;

create policy "Workspace members can read own workspace"
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

create policy "Admins can update own workspace"
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

comment on policy "Workspace members can read own workspace" on public.workspaces is
  'Allows authenticated users to read the identity of their own active workspace without depending on helper functions.';

comment on policy "Admins can update own workspace" on public.workspaces is
  'Allows active owners/admins to update identity fields for their own workspace without depending on helper functions.';
```

Depois de aplicar, valide:

- Login admin da Eliane.
- Dashboard exibindo identidade do workspace em vez de fallback `Meu Painel/MP`.
- `/admin/configuracoes` carregando nome, slug, logo, especialidade e cores.
- Checklist do portal mostrando os itens preenchidos, nao `0/7`.
- Portal publico `/w/eliane-goncalves`.
- Area do paciente teste.
