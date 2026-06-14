create table if not exists public.patient_access_tokens (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamp with time zone not null,
  used_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

create index if not exists patient_access_tokens_workspace_id_idx
on public.patient_access_tokens(workspace_id);

create index if not exists patient_access_tokens_patient_id_idx
on public.patient_access_tokens(patient_id);

create index if not exists patient_access_tokens_token_hash_idx
on public.patient_access_tokens(token_hash);

alter table public.patient_access_tokens enable row level security;

comment on table public.patient_access_tokens is
  'Tokens temporarios para troca segura de convite do paciente por sessao Supabase.';
comment on column public.patient_access_tokens.token_hash is
  'Hash SHA-256 do token enviado ao paciente. O token puro nunca deve ser salvo.';
comment on column public.patient_access_tokens.used_at is
  'Preenchido quando o convite e consumido para gerar o link de autenticacao Supabase.';
