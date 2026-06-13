create extension if not exists "pgcrypto";

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  primary_color text,
  secondary_color text,
  whatsapp text,
  domain text,
  plan text default 'starter',
  active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  workspace_id uuid references public.workspaces(id) on delete set null,
  name text not null,
  email text not null,
  role text not null check (role in ('owner', 'admin', 'patient')),
  active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  professional_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text,
  phone text,
  birth_date date,
  active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  patient_id uuid references public.patients(id) on delete set null,
  professional_id uuid references public.profiles(id) on delete set null,
  scheduled_at timestamp with time zone,
  notes text,
  status text default 'scheduled',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.patient_notes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  patient_id uuid references public.patients(id) on delete set null,
  professional_id uuid references public.profiles(id) on delete set null,
  title text,
  content text,
  emoji text default '💬',
  active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table if not exists public.patient_resources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.workspaces(id) on delete set null,
  patient_id uuid references public.patients(id) on delete set null,
  professional_id uuid references public.profiles(id) on delete set null,
  type text not null check (
    type in (
      'pdf',
      'youtube',
      'spotify',
      'image',
      'file',
      'spreadsheet',
      'document',
      'other'
    )
  ),
  title text not null,
  description text,
  url text,
  storage_path text,
  filename text,
  mime_type text,
  emoji text,
  active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists workspaces_slug_idx on public.workspaces(slug);
create index if not exists profiles_workspace_id_idx on public.profiles(workspace_id);
create index if not exists profiles_email_idx on public.profiles(email);
create index if not exists patients_workspace_id_idx on public.patients(workspace_id);
create index if not exists patients_profile_id_idx on public.patients(profile_id);
create index if not exists patients_professional_id_idx on public.patients(professional_id);
create index if not exists patients_email_idx on public.patients(email);
create index if not exists appointments_workspace_id_idx on public.appointments(workspace_id);
create index if not exists appointments_patient_id_idx on public.appointments(patient_id);
create index if not exists appointments_professional_id_idx on public.appointments(professional_id);
create index if not exists patient_notes_workspace_id_idx on public.patient_notes(workspace_id);
create index if not exists patient_notes_patient_id_idx on public.patient_notes(patient_id);
create index if not exists patient_notes_professional_id_idx on public.patient_notes(professional_id);
create index if not exists patient_resources_workspace_id_idx on public.patient_resources(workspace_id);
create index if not exists patient_resources_patient_id_idx on public.patient_resources(patient_id);
create index if not exists patient_resources_professional_id_idx on public.patient_resources(professional_id);

alter table public.workspaces enable row level security;
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.patient_notes enable row level security;
alter table public.patient_resources enable row level security;

comment on table public.workspaces is
  'RLS habilitado. Policies futuras devem limitar acesso por workspace ativo e papel owner/admin.';
comment on table public.profiles is
  'RLS habilitado. Policies futuras devem permitir leitura do proprio perfil e gestao por admins do mesmo workspace.';
comment on table public.patients is
  'RLS habilitado. Policies futuras devem isolar pacientes por workspace e vinculo com profissional/paciente autenticado.';
comment on table public.appointments is
  'RLS habilitado. Policies futuras devem restringir consultas ao workspace, profissional responsavel e paciente vinculado.';
comment on table public.patient_notes is
  'RLS habilitado. Policies futuras devem restringir notas ao workspace, profissional responsavel e paciente autorizado.';
comment on table public.patient_resources is
  'RLS habilitado. Policies futuras devem restringir recursos ao workspace, profissional responsavel e paciente autorizado.';
