alter table public.patients
  add column if not exists public_access_token_hash text,
  add column if not exists public_access_token_created_at timestamp with time zone,
  add column if not exists public_access_enabled boolean not null default true;

create unique index if not exists patients_public_access_token_hash_key
on public.patients(public_access_token_hash)
where public_access_token_hash is not null;

create index if not exists patients_public_access_lookup_idx
on public.patients(public_access_token_hash, public_access_enabled, active);

comment on column public.patients.public_access_token_hash is
  'Hash sha256 do token permanente publico do paciente. O token puro nunca deve ser salvo.';

comment on column public.patients.public_access_token_created_at is
  'Timestamp usado para derivar/recriar o token publico permanente enquanto o acesso estiver ativo.';

comment on column public.patients.public_access_enabled is
  'Permite desativar o acesso publico por token sem desativar o cadastro do paciente.';
