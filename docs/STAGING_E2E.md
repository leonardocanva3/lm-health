# Teste de staging autenticado

Este guia explica como preparar uma base real de teste para rodar a auditoria E2E autenticada do Meu Painel.

> Importante: use este processo apenas em ambiente local ou staging. Nunca rode o seed `supabase/seed/staging.sql` no banco de producao.

## 1. Objetivo do staging

O staging autenticado serve para validar o sistema ponta a ponta com usuarios reais do Supabase Auth, dados comerciais do workspace, paciente, agenda, orientacoes, recursos e portal publico.

Com ele e possivel testar:

- Login do profissional.
- Dashboard admin.
- Pacientes.
- Agenda.
- Recursos ativos e inativos.
- Orientacoes ativas e inativas.
- Configuracoes white label.
- Portal publico `/w/clinica-modelo`.
- Area do paciente mostrando apenas dados ativos.

## 2. Pre-requisitos

Antes de rodar os testes, confirme que voce tem:

- Projeto local ou staging configurado com Supabase.
- Migrations aplicadas no banco de local/staging.
- Acesso ao painel do Supabase do ambiente de teste.
- Node e dependencias instaladas com `npm.cmd install`.
- O arquivo `supabase/seed/staging.sql` disponivel.

Nao use dados reais de pacientes, profissionais ou clinicas.

## 3. Criar usuarios no Supabase Auth

No painel do Supabase do ambiente local/staging:

1. Acesse `Authentication`.
2. Abra `Users`.
3. Clique em `Add user` ou `Invite user`, conforme a interface disponivel.
4. Crie o usuario admin:
   - Email: `admin.teste@lmhealth.local`
   - Senha: escolha uma senha apenas para teste.
5. Crie o usuario paciente:
   - Email: `paciente.teste@lmhealth.local`
   - Senha: escolha uma senha apenas para teste.

Guarde as senhas apenas no ambiente local/staging. Nao coloque senhas no git, no seed SQL ou em documentos versionados.

## 4. Confirmar emails ou desabilitar confirmacao

Os testes precisam conseguir fazer login com email e senha.

Voce tem duas opcoes no ambiente local/staging:

1. Confirmar manualmente os emails dos dois usuarios no painel do Supabase.
2. Desabilitar a confirmacao de email no projeto local/staging.

Para confirmar manualmente, abra cada usuario no Supabase Auth e marque o email como confirmado, se essa opcao estiver disponivel.

Para desabilitar confirmacao em local/staging, ajuste a configuracao de Auth do projeto de teste. Nao desabilite confirmacao no ambiente de producao sem uma decisao consciente de seguranca.

## 5. Rodar o seed de staging

Depois de criar os usuarios no Supabase Auth, rode o seed:

```bash
supabase/seed/staging.sql
```

Voce pode executar pelo SQL Editor do Supabase ou pela ferramenta local que usa para rodar SQL no banco de staging.

O seed cria dados deterministicos:

- Workspace `Clinica Modelo`.
- Slug publico `clinica-modelo`.
- Perfil admin `Admin Teste`.
- Paciente `Joao da Silva`.
- Consulta de teste.
- Orientacao ativa.
- Orientacao inativa.
- Recurso ativo.
- Recurso inativo.

Se o seed reclamar que um usuario Auth nao existe, crie o usuario indicado e rode novamente.

## 6. Configurar variaveis E2E

Antes de rodar os testes autenticados, configure as variaveis no terminal:

```powershell
$env:E2E_ADMIN_EMAIL="admin.teste@lmhealth.local"
$env:E2E_ADMIN_PASSWORD="senha-do-admin-de-teste"
$env:E2E_PATIENT_EMAIL="paciente.teste@lmhealth.local"
$env:E2E_PATIENT_PASSWORD="senha-do-paciente-de-teste"
$env:E2E_PUBLIC_WORKSPACE_SLUG="clinica-modelo"
```

Use as senhas criadas no Supabase Auth do ambiente local/staging.

## 7. Executar a auditoria

Com as variaveis configuradas, rode:

```bash
npm.cmd run audit:mvp
```

Esse comando executa:

- Lint.
- Build.
- Testes E2E.

## 8. Interpretar o resultado

- `passed`: o teste rodou e passou.
- `skipped`: o teste foi pulado. Isso normalmente acontece quando as variaveis E2E nao foram configuradas.
- `failed`: o teste falhou e precisa ser investigado antes de considerar o MVP pronto.

Para validar staging autenticado completo, os testes de login/admin/paciente nao devem ficar como `skipped`. Se ficarem, revise as variaveis de ambiente.

## 9. Checklist final antes de vender

Antes de avancar para venda, confirme:

- `npm.cmd run lint` passa.
- `npm.cmd run build` passa.
- `npm.cmd run audit:mvp` passa.
- Os testes autenticados rodam como `passed`, nao como `skipped`.
- O portal `/w/clinica-modelo` abre sem login.
- O admin ve paciente, agenda, recursos e orientacoes de teste.
- A area do paciente mostra apenas a orientacao ativa.
- A area do paciente mostra apenas o recurso ativo.
- A area do paciente nao mostra dados inativos.
- Nenhum dado real foi usado no ambiente de teste.
- O seed nao foi executado em producao.
