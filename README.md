# Área de Membros — Mentoria Império

App React (Vite) da área de membros: Comunidade, Aulas, Suporte 24/7 e
Ajustes. Na sidebar, logo abaixo de Aulas, tem um link direto pro Sistema
de Renda Digital — a ferramenta de geração de oferta, que é um sistema
separado (abre em outra aba, não tem tela própria aqui dentro).

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`. Nenhuma configuração é obrigatória para
rodar — todas as telas funcionam com dados de exemplo em `src/data/mockData.js`.

## Passo a passo: deixar a Comunidade funcionando de verdade

Hoje o projeto roda em "modo demonstração": tudo (posts, curtidas, login)
usa dados de exemplo e nada é salvo. Pra virar real — login de verdade,
posts e curtidas persistindo, todo aluno vendo o feed de todo mundo — siga
os passos abaixo. Já implementei todo o código (login, cadastro, conexão
com o banco); os passos 1 a 4 são coisas que só você consegue fazer, porque
dependem da sua conta.

**1. Criar o projeto no Supabase**
Entre em [supabase.com](https://supabase.com), crie uma conta grátis e
clique em "New project". Escolha um nome (ex: `srd-membros`), uma senha
para o banco (guarde essa senha em local seguro) e a região mais próxima
do seu público (ex: South America). Aguarde uns 2 minutos até o projeto
ficar pronto.

**2. Rodar o schema do banco**
Dentro do projeto, vá em **SQL Editor** (menu lateral) → **New query**.
Abra o arquivo `supabase/schema.sql` deste projeto, copie todo o conteúdo,
cole no editor e clique em **Run**. Isso cria as tabelas de perfis, posts,
curtidas, comentários, aulas e progresso, já com as permissões de acesso
configuradas (cada aluno só edita o que é dele, mas todos podem ler o feed).

**3. Pegar a URL e a chave do projeto**
Vá em **Project Settings** (ícone de engrenagem) → **API**. Copie o
**Project URL** e a chave **anon public** (não a `service_role`, essa é
secreta e nunca deve ir pro front-end).

**4. Preencher o `.env`**
Na raiz do projeto, copie `.env.example` para um novo arquivo `.env` e
cole os dois valores:
```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

**5. (Opcional, mas recomendado pra testar rápido) Desligar a confirmação por e-mail**
Por padrão, o Supabase exige que o aluno clique num link de confirmação
antes de conseguir entrar. Pra testar localmente sem precisar checar
e-mail toda hora, vá em **Authentication** → **Sign In / Providers** →
**Email**, e desmarque "Confirm email". Você pode reativar isso depois,
quando for pra produção, se quiser essa camada extra de segurança.

**6. Rodar local e testar**
```bash
npm install
npm run dev
```
Abra `http://localhost:5173` — agora vai aparecer a tela de login. Clique
em "Criar conta", cadastre-se com um e-mail/senha de teste, e você já cai
direto na Comunidade. Publique um post, curta, abra em uma aba anônima e
crie uma segunda conta pra confirmar que os dois usuários se veem.

## Passo a passo: cadastrar as aulas (sem mexer em código)

As aulas também já estão ligadas ao Supabase (mesmo projeto do passo
anterior) — assim que você configurar o `.env`, o app passa a ler da
tabela `lessons` em vez dos dados de exemplo. Pra cadastrar uma aula:

1. No painel do Supabase, vá em **Table Editor** (menu lateral) →
   selecione a tabela `lessons` → **Insert** → **Insert row**.
2. Preencha `title` (nome da aula), `description` (texto curto, opcional —
   só é usado na aula em destaque), `youtube_id` (o código do vídeo — a
   parte depois de `v=` na URL do YouTube, ex: em
   `youtube.com/watch?v=dQw4w9WgXcQ` o ID é `dQw4w9WgXcQ`), `duration_seconds`
   (opcional, a duração em segundos) e `module_order` (um número pra
   controlar a ordem — 1, 2, 3...).
3. Numa única aula, marque `is_featured` como `true` — ela vira a aula em
   destaque no topo da página. As demais ficam na grade abaixo, ordenadas
   por `module_order`.
4. Repita pra cada aula. Não precisa editar nenhum arquivo nem fazer
   deploy de novo — assim que salvar no Supabase, já aparece pros alunos.

Se preferir não usar o Table Editor, existe também um **painel admin
dentro do próprio site** — veja a seção abaixo.

## Painel de administrador (aulas, comunidade e alunos, sem abrir o Supabase)

Existe uma tela `/admin` (aparece na sidebar como "Painel admin", só pra
quem for administrador) com três abas: **Aulas** (cadastrar/editar/apagar,
o mesmo que o Table Editor faz, só que direto no site), **Comunidade**
(apagar posts inadequados) e **Alunos** (ver quem já se cadastrou — nome,
e-mail, data).

**1. Rodar a migração do banco**
No **SQL Editor** do Supabase, cole e rode o conteúdo de
`supabase/migration_001_admin.sql` — isso adiciona a coluna `is_admin` e
as permissões necessárias. Se você ainda não tinha rodado nada, pode rodar
só o `schema.sql` normal (já vem com isso incluído).

**2. Marcar a si mesma como administradora**
Em **Table Editor → profiles**, ache a sua linha (pelo seu e-mail/nome) e
edite o campo `is_admin` pra `true`. Salve. Só quem tiver esse campo `true`
vê e usa o painel — os demais alunos nem enxergam o link na sidebar.

**3. Configurar a lista de alunos**
A aba "Alunos" usa a mesma `SUPABASE_SECRET_KEY` que você já configurou
pra integração com a Lastlink (se ainda não configurou, veja a seção
"Integração automática com a Lastlink" abaixo). Sem essa variável, as
abas de Aulas e Comunidade funcionam normalmente — só a lista de Alunos
não carrega.

Depois de marcar seu usuário como admin e recarregar o site, o link
"Painel admin" aparece na sidebar, abaixo de Ajustes.

O progresso (quantas aulas cada aluno já assistiu) também já é salvo
automaticamente na tabela `lesson_progress` quando o aluno abre um vídeo.

## Colocar no ar

Com o Supabase configurado (`.env` preenchido) e as aulas cadastradas,
falta só publicar. O jeito mais simples pra um projeto Vite é a Vercel:

1. Suba este projeto pra um repositório no GitHub (crie um repo novo e
   suba os arquivos, ou use `git init` + `git push` se já souber git).
2. Entre em [vercel.com](https://vercel.com), crie conta (dá pra usar a
   conta do GitHub) e clique em **Add New → Project**, escolhendo o
   repositório que você acabou de subir. A Vercel já detecta que é um
   projeto Vite automaticamente.
3. Antes de clicar em Deploy, abra **Environment Variables** e adicione
   as mesmas variáveis do seu `.env`: `VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`, e `VITE_FERRAMENTA_URL` /
   `VITE_CHAT_API_URL` se já tiver esses dois prontos. Sem isso, a versão
   publicada volta a rodar em modo demonstração.
4. Clique em **Deploy**. Em cerca de um minuto você recebe uma URL
   (`algumacoisa.vercel.app`) já no ar. Pra usar seu próprio domínio,
   é em **Project Settings → Domains** na Vercel.

Netlify funciona do mesmo jeito (build command `npm run build`, publish
directory `dist`), se preferir.

## Outras conexões (Suporte 24/7, Sistema de Renda Digital)

- **Suporte 24/7 (chat com IA)**: implemente um back-end (serverless
  function, API própria etc.) que recebe `{ messages }` e devolve
  `{ reply }`, guardando a chave da API de IA (OpenAI, Anthropic, ...) do
  lado do servidor — nunca no front-end. Aponte `VITE_CHAT_API_URL` pra
  esse endpoint. Sem isso, o chat responde com mensagens simuladas.
- **Sistema de Renda Digital**: aponte `VITE_FERRAMENTA_URL` para o
  domínio real da ferramenta — é o link que aparece na sidebar, logo
  abaixo de Aulas. Sem configurar, o link fica inativo (`#`).

## Integração automática com a Lastlink (criar conta na compra)

Por padrão, qualquer pessoa pode clicar em "Criar conta" na tela de login e
entrar de graça — bom pra testar, mas não é o fluxo certo pra vender. O
arquivo `api/lastlink-webhook.js` resolve isso: é uma função que recebe o
aviso da Lastlink quando uma compra é aprovada e cria a conta do aluno
automaticamente, mandando um e-mail de convite pra ele definir a senha.
Ela já vem pronta, só precisa configurar:

**1. Pegar a chave secreta do Supabase**
Em **Project Settings → API Keys**, copie a **Secret key** (`sb_secret_...`).
Essa é diferente da Publishable key usada no `.env` — essa fica só no
servidor, nunca no front-end.

**2. Inventar uma senha pro webhook**
Crie uma senha qualquer (ex: uma string longa e aleatória) — ela serve só
pra confirmar que quem está chamando essa função é mesmo a Lastlink, e não
qualquer pessoa na internet.

**3. Adicionar as variáveis na Vercel**
Em **Project Settings → Environment Variables**, no projeto da Vercel,
adicione (sem o prefixo `VITE_`, essas não podem ir pro front-end):
```
SUPABASE_SECRET_KEY=sb_secret_...
LASTLINK_WEBHOOK_SECRET=a-senha-que-voce-inventou
```
Depois clique em **Redeploy** pra essas variáveis entrarem em vigor.

**4. Configurar o webhook no painel da Lastlink**
Em **Configurações → Webhooks** (dentro do produto na Lastlink), adicione
a URL:
```
https://SEU-SITE.vercel.app/api/lastlink-webhook?secret=a-senha-que-voce-inventou
```
Escolha o evento de **compra aprovada / pagamento confirmado** (o nome
exato pode variar — use o botão de enviar um evento de teste da Lastlink e
confira, nos **Logs** da função em Vercel, qual valor chegou no campo
`Event`). Se o nome não bater com os padrões já aceitos
(`PurchaseApproved`, `PaymentConfirmed`, `AccessGranted`), adicione a
variável `LASTLINK_EVENTS` na Vercel com o(s) nome(s) certo(s), separados
por vírgula, e faça Redeploy.

**5. Testar**
Use o botão de teste da Lastlink (ou faça uma compra de teste, se a
plataforma tiver modo sandbox). O aluno deve receber um e-mail do Supabase
com um link pra criar a senha e acessar.

⚠️ O envio de e-mail usado aqui é o padrão do Supabase, que é limitado e
pode atrasar ou não entregar (o mesmo problema que apareceu ao testar o
cadastro manual). Pra produção de verdade, vale configurar um provedor de
e-mail próprio em **Authentication → Settings → SMTP Settings** no
Supabase (ex: Resend, SendGrid, seu próprio domínio) — assim os e-mails de
acesso chegam de forma confiável. Posso te ajudar a configurar isso quando
quiser.

## Estrutura

```
src/
  components/    Sidebar, Layout, ícones
  pages/         Comunidade, Aulas, Suporte, Ajustes, Login, Admin
  data/          dados de exemplo
  lib/           clientes de Supabase e do chat de IA
api/
  lastlink-webhook.js   cria conta do aluno quando a Lastlink avisa de uma compra
  admin/students.js     lista alunos pro painel admin (usa a chave secreta)
supabase/
  schema.sql               schema completo (tabelas + RLS), pra projeto novo
  migration_001_admin.sql  só a parte do admin, pra projeto que já existe
```

## Identidade visual

Os tokens de cor/tipografia estão centralizados em `src/index.css`
(fundo `#1a150f`, cards `#221c15`, dourado em gradiente `#f3d386 → #c8862c`,
fonte Quicksand, self-hosted via `@fontsource/quicksand`) — reutilize as classes `.srd-card`, `.srd-btn-gold` e
`.srd-btn-outline` em qualquer tela nova para manter a consistência.

## Build de produção

```bash
npm run build
```

Gera a pasta `dist/` pronta para deploy (Vercel, Netlify, etc.).
