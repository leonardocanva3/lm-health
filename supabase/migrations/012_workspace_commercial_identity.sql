alter table public.workspaces
  add column if not exists specialty text,
  add column if not exists phone text,
  add column if not exists instagram text,
  add column if not exists site text,
  add column if not exists address text,
  add column if not exists city_state text,
  add column if not exists business_hours text;

comment on column public.workspaces.specialty is
  'Especialidade principal exibida no painel white label e portal do paciente.';
comment on column public.workspaces.phone is
  'Telefone comercial do profissional ou clinica.';
comment on column public.workspaces.instagram is
  'Perfil do Instagram do profissional ou clinica.';
comment on column public.workspaces.site is
  'Site comercial do profissional ou clinica.';
comment on column public.workspaces.address is
  'Endereco comercial exibido ao paciente.';
comment on column public.workspaces.city_state is
  'Cidade e UF do atendimento.';
comment on column public.workspaces.business_hours is
  'Horario de atendimento informado pelo workspace.';
