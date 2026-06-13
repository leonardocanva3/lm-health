# Teste real do MVP LM Health

Este fluxo usa Supabase Auth, profiles, pacientes, agenda, orientações e
recursos reais. Não usa service role no frontend.

## 1. Criar usuário owner

1. No Supabase, acesse **Authentication > Users**.
2. Crie um usuário para o profissional ou dono do workspace.
3. Copie o `id` do usuário.
4. Crie ou escolha um workspace:

```sql
insert into public.workspaces (name, slug)
values ('Clínica Demo', 'clinica-demo')
returning id;
```

5. Crie o profile owner:

```sql
insert into public.profiles (id, workspace_id, name, email, role, active)
values (
  'USER_ID_OWNER',
  'WORKSPACE_ID',
  'Profissional Demo',
  'owner@clinica.com',
  'owner',
  true
);
```

## 2. Criar paciente no app

1. Rode `npm run dev`.
2. Entre em `/entrar` com o usuário owner.
3. Acesse `/admin/pacientes`.
4. Cadastre o paciente com nome, email e demais dados.

## 3. Criar usuário patient

1. No Supabase, acesse **Authentication > Users**.
2. Crie um usuário com o email do paciente.
3. Defina uma senha temporária segura.
4. Copie o `id` do usuário patient.

## 4. Criar profile patient

```sql
insert into public.profiles (id, workspace_id, name, email, role, active)
values (
  'USER_ID_PATIENT',
  'WORKSPACE_ID',
  'Nome do Paciente',
  'paciente@email.com',
  'patient',
  true
);
```

## 5. Vincular patients.profile_id

No registro criado em `public.patients`, preencha `profile_id` com o ID do
usuário patient:

```sql
update public.patients
set profile_id = 'USER_ID_PATIENT'
where id = 'PATIENT_ROW_ID'
  and workspace_id = 'WORKSPACE_ID';
```

## 6. Criar dados para o paciente

Com o owner/admin logado:

1. Acesse `/admin/agenda` e crie uma consulta para o paciente.
2. Acesse `/admin/orientacoes` e crie uma orientação ativa.
3. Acesse `/admin/recursos` e crie recursos ativos por URL.

## 7. Testar portal do paciente

1. Saia da conta owner/admin.
2. Entre em `/entrar` com o usuário patient.
3. O app deve redirecionar para `/paciente`.
4. Verifique:
   - saudação com o nome do paciente
   - próxima consulta
   - orientações ativas
   - recursos ativos agrupados por tipo

Se o portal mostrar estados vazios, confirme se `patients.profile_id` está
vinculado ao mesmo `auth.users.id` do usuário patient.
