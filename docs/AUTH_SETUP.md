# LM Health Auth Setup

Este projeto usa Supabase Auth com `NEXT_PUBLIC_SUPABASE_URL` e
`NEXT_PUBLIC_SUPABASE_ANON_KEY`. Não use service role key no frontend.

## Criar usuário no Supabase Auth

1. Acesse o projeto no Supabase.
2. Vá em **Authentication > Users**.
3. Clique em **Add user**.
4. Informe email e senha.
5. Confirme o usuário, caso o projeto exija confirmação de email.

## Inserir profile manualmente

Depois de criar o usuário, copie o `id` dele em **Authentication > Users** e
crie um registro em `public.profiles`.

Exemplo para profissional admin:

```sql
insert into public.profiles (
  id,
  workspace_id,
  name,
  email,
  role,
  active
) values (
  'USER_ID_DO_SUPABASE_AUTH',
  'WORKSPACE_ID_EXISTENTE',
  'Dra. Ana Silva',
  'ana@clinica.com',
  'admin',
  true
);
```

Exemplo para owner:

```sql
insert into public.profiles (
  id,
  workspace_id,
  name,
  email,
  role,
  active
) values (
  'USER_ID_DO_SUPABASE_AUTH',
  'WORKSPACE_ID_EXISTENTE',
  'Responsável da Clínica',
  'owner@clinica.com',
  'owner',
  true
);
```

Exemplo para paciente:

```sql
insert into public.profiles (
  id,
  workspace_id,
  name,
  email,
  role,
  active
) values (
  'USER_ID_DO_SUPABASE_AUTH',
  'WORKSPACE_ID_EXISTENTE',
  'Marina Souza',
  'marina@email.com',
  'patient',
  true
);
```

## Criar workspace mínimo

Se ainda não existir workspace:

```sql
insert into public.workspaces (name, slug)
values ('Clínica Demo', 'clinica-demo')
returning id;
```

Use o `id` retornado como `workspace_id` nos profiles.

## Testar login

1. Rode o projeto com `npm run dev`.
2. Acesse `/entrar`.
3. Entre com email e senha do usuário criado no Supabase Auth.
4. Se `role` for `owner` ou `admin`, o app redireciona para `/admin`.
5. Se `role` for `patient`, o app redireciona para `/paciente`.
6. Se não existir profile ativo para o usuário, o app mostra:
   "Perfil não encontrado. Fale com o administrador."

## RLS necessária

A migration `002_auth_profile_policies.sql` cria uma policy mínima para o
usuário autenticado ler apenas o próprio profile ativo. Sem essa policy, o app
não consegue resolver `profiles.role` com RLS habilitado.
