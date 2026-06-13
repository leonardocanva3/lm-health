alter table public.workspaces
  add column if not exists slug text;

with generated_slugs as (
  select
    id,
    coalesce(
      nullif(
        regexp_replace(
          regexp_replace(coalesce(nullif(btrim(name), ''), 'workspace'), '[^a-zA-Z0-9]+', '-', 'g'),
          '(^-+|-+$)',
          '',
          'g'
        ),
        ''
      ),
      'workspace'
    ) as base_slug
  from public.workspaces
  where slug is null or btrim(slug) = ''
)
update public.workspaces w
set slug = lower(regexp_replace(g.base_slug || '-' || left(w.id::text, 8), '-+', '-', 'g'))
from generated_slugs g
where w.id = g.id;

with invalid_slugs as (
  select
    id,
    coalesce(
      nullif(
        regexp_replace(
          regexp_replace(coalesce(nullif(btrim(slug), ''), nullif(btrim(name), ''), 'workspace'), '[^a-zA-Z0-9]+', '-', 'g'),
          '(^-+|-+$)',
          '',
          'g'
        ),
        ''
      ),
      'workspace'
    ) as base_slug
  from public.workspaces
  where slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
)
update public.workspaces w
set slug = lower(regexp_replace(i.base_slug || '-' || left(w.id::text, 8), '-+', '-', 'g'))
from invalid_slugs i
where w.id = i.id;

create unique index if not exists workspaces_slug_unique_idx
on public.workspaces(slug);

alter table public.workspaces
  alter column slug set not null;

alter table public.workspaces
  add constraint workspaces_slug_format_check
  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
  not valid;

alter table public.workspaces
  validate constraint workspaces_slug_format_check;

comment on column public.workspaces.slug is
  'Slug publico unico usado no portal white label em /w/[slug].';
