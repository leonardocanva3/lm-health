insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'workspace-logos',
  'workspace-logos',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/jpg']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Workspace logo public read" on storage.objects;
drop policy if exists "Workspace admins upload logos" on storage.objects;
drop policy if exists "Workspace admins update logos" on storage.objects;
drop policy if exists "Workspace admins delete logos" on storage.objects;

create policy "Workspace logo public read"
on storage.objects
for select
to public
using (
  bucket_id = 'workspace-logos'
);

create policy "Workspace admins upload logos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'workspace-logos'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and p.role in ('owner', 'admin')
      and p.workspace_id::text = (storage.foldername(name))[1]
  )
);

create policy "Workspace admins update logos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'workspace-logos'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and p.role in ('owner', 'admin')
      and p.workspace_id::text = (storage.foldername(name))[1]
  )
)
with check (
  bucket_id = 'workspace-logos'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and p.role in ('owner', 'admin')
      and p.workspace_id::text = (storage.foldername(name))[1]
  )
);

create policy "Workspace admins delete logos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'workspace-logos'
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and p.role in ('owner', 'admin')
      and p.workspace_id::text = (storage.foldername(name))[1]
  )
);
