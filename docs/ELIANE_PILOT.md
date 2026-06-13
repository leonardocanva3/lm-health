# Piloto Eliane Goncalves

Este documento descreve como conectar a pagina existente da Eliane Goncalves com a Area do Paciente real do LM Health, sem alterar o layout global do site e sem usar dados reais sensiveis.

## URLs

- Pagina atual da Eliane: `https://www.psicologaelianegoncalves.com.br/area-do-paciente`
- Destino provisorio do LM Health: `https://DOMINIO-DO-LM-HEALTH/paciente`
- Variavel recomendada no site da Eliane: `NEXT_PUBLIC_LM_HEALTH_PATIENT_URL`
- Slug do workspace no LM Health: `eliane-goncalves`
- Portal publico do workspace, quando o dominio estiver definido: `/w/eliane-goncalves`

## Estrategia do piloto

Manter a pagina `/area-do-paciente` do site da Eliane como apresentacao e substituir o texto de placeholder por uma chamada real:

> Esta area foi criada para facilitar o acesso a orientacoes, materiais de apoio e informacoes importantes do seu acompanhamento. Para acessar, utilize o botao abaixo e entre com seus dados de paciente.

Adicionar o CTA principal:

```txt
Acessar minha area do paciente
```

O CTA deve apontar para `NEXT_PUBLIC_LM_HEALTH_PATIENT_URL` e abrir preferencialmente na mesma aba.

## Seed do LM Health

Arquivo:

```txt
supabase/seed/eliane-goncalves.sql
```

O seed cria dados de piloto para:

- Workspace `Eliane Goncalves`.
- Especialidade `Psicologia`.
- Slug `eliane-goncalves`.
- Plano `piloto`.
- Paciente de teste.
- Consulta futura de teste.
- Orientacao ativa.
- Orientacao inativa.
- Recurso ativo.
- Recurso inativo.

O seed nao cria senhas e nao deve ser executado em producao.

## Usuarios Auth necessarios

Crie no Supabase Auth do ambiente local/staging/piloto:

- `eliane.goncalves@lmhealth.local`
- `paciente.eliane.teste@lmhealth.local`

Use senhas apenas de teste e confirme os emails, ou desabilite confirmacao apenas no ambiente local/staging/piloto.

## Como aplicar o seed

1. Abra o SQL Editor do Supabase no ambiente local/staging/piloto.
2. Confirme que os usuarios Auth acima existem.
3. Execute o conteudo de:

```txt
supabase/seed/eliane-goncalves.sql
```

Se o SQL informar que algum usuario esta ausente, crie o usuario no Supabase Auth e execute novamente.

## Como configurar o botao no site da Eliane

No projeto do site da Eliane, configure:

```env
NEXT_PUBLIC_LM_HEALTH_PATIENT_URL=https://DOMINIO-DO-LM-HEALTH/paciente
```

Na pagina `/area-do-paciente`, use essa variavel no CTA:

```tsx
const patientAreaUrl =
  process.env.NEXT_PUBLIC_LM_HEALTH_PATIENT_URL ?? "https://DOMINIO-DO-LM-HEALTH/paciente";
```

O botao deve usar o estilo ja existente no site e navegar para `patientAreaUrl`.

## Como testar como admin

1. Acesse o LM Health no dominio de staging.
2. Entre com `eliane.goncalves@lmhealth.local`.
3. Verifique:
   - Dashboard abre.
   - Workspace aparece como `Eliane Goncalves`.
   - Paciente `Paciente Teste Eliane` aparece em Pacientes.
   - Agenda mostra a consulta futura de teste.
   - Orientacoes mostram item ativo e inativo.
   - Recursos mostram item ativo e inativo.

## Como testar como paciente

1. Acesse `https://www.psicologaelianegoncalves.com.br/area-do-paciente`.
2. Clique em `Acessar minha area do paciente`.
3. Entre com `paciente.eliane.teste@lmhealth.local`.
4. Verifique:
   - A area do paciente abre.
   - A orientacao ativa aparece.
   - O recurso ativo aparece.
   - A orientacao inativa nao aparece.
   - O recurso inativo nao aparece.

## Alteracao esperada no site da Eliane

O repositorio do site da Eliane nao esta neste workspace. A alteracao deve ser feita no arquivo que renderiza `/area-do-paciente`.

Manter:

- Header atual.
- Footer atual.
- Identidade visual atual.
- Estrutura visual da pagina.

Trocar apenas o texto de placeholder e adicionar o CTA principal.
