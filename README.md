# Custódia de Cartões — Consulta de Nomes

App de consulta de nomes para controle de custódia de cartões, em conformidade com a LGPD (armazena apenas nomes, sem CPF, agência ou conta corrente). Possui banco de dados real (Supabase/Postgres), autenticação por usuário e senha (NextAuth) e dois perfis de acesso: **Administrador** (cadastra/edita/exclui nomes) e **Consulta** (somente visualiza).

---

## 1. Criar o banco de dados no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie uma conta grátis.
2. Clique em **New Project**. Escolha um nome, uma senha de banco (guarde-a) e a região mais próxima (ex: South America).
3. Aguarde o projeto ser criado (leva ~2 minutos).
4. No menu lateral, vá em **SQL Editor** → **New query**.
5. Abra o arquivo [`supabase/schema.sql`](./supabase/schema.sql) deste projeto, copie todo o conteúdo, cole no editor e clique em **Run**.
   - Isso cria as tabelas `usuarios` e `cartoes` (apenas com `id` e `nome`), com segurança (RLS) habilitada.
   - Já inclui 3 nomes de exemplo (pode apagar depois pelo próprio app).
6. Vá em **Project Settings → API**. Você vai precisar de dois valores:
   - **Project URL** → vira `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role key** (em "Project API keys", clique para revelar) → vira `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ A `service_role key` dá acesso total ao banco. Nunca a exponha no navegador — neste projeto ela só é usada no servidor (API routes), o que já está configurado corretamente.

## 2. Configurar o projeto localmente

```bash
npm install
cp .env.example .env.local
```

Edite `.env.local` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
NEXTAUTH_SECRET=   # gere com: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
```

## 3. Criar o primeiro usuário administrador

Como o cadastro de usuários é manual (só admins criam outros usuários pelo app), o **primeiro** admin precisa ser criado direto no banco, via script:

```bash
npm run create-user -- admin.silva "senhaForte123" "Admin Silva" admin
```

Depois de logado com esse usuário, você pode criar os demais funcionários pela tela **Usuários** dentro do próprio app (sem precisar mexer no terminal de novo).

## 4. Rodar localmente

```bash
npm run dev
```

Acesse `http://localhost:3000`, faça login com o usuário criado no passo 3.

## 5. Deploy na Vercel

1. Suba este projeto para um repositório no GitHub (crie um repo novo e faça `git push`).
2. Acesse [vercel.com](https://vercel.com), faça login com GitHub e clique em **Add New → Project**.
3. Selecione o repositório do projeto.
4. Em **Environment Variables**, adicione as mesmas 4 variáveis do `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` → coloque a URL que a Vercel vai gerar (ex: `https://custodia-cartoes.vercel.app`). Se não souber ainda, coloque qualquer coisa, faça o primeiro deploy, copie a URL final e atualize essa variável (a Vercel refaz o deploy sozinha ao salvar).
5. Clique em **Deploy**. Em ~1 minuto o site estará no ar.

Pronto — dali em diante, qualquer `git push` na branch principal atualiza o site automaticamente.

## Estrutura do projeto

```
app/
  login/             → tela de login
  usuarios/          → gestão de usuários (admin)
  api/auth/          → NextAuth (login/logout)
  api/cartoes/       → CRUD de cartões (protegido por sessão/perfil)
  api/usuarios/      → CRUD de usuários (só admin)
  page.tsx           → dashboard principal (protegido)
components/
  Dashboard.tsx      → UI principal (lista, busca, índice A-Z, modais)
lib/
  authOptions.ts     → configuração do NextAuth (credentials + bcrypt)
  supabaseAdmin.ts    → cliente Supabase (service role, uso só no servidor)
middleware.ts        → protege rotas por sessão e por perfil
supabase/schema.sql   → schema do banco (rodar no SQL Editor do Supabase)
scripts/create-user.mjs → cria o primeiro usuário admin
```

## Segurança

- Senhas nunca são salvas em texto puro — são hasheadas com `bcrypt`.
- As tabelas no Supabase têm Row Level Security habilitada e **sem policies públicas**; todo acesso passa pelo backend do app, autenticado por sessão.
- Rotas de escrita (`POST`/`PUT`/`DELETE`) verificam o perfil (`admin`) tanto no `middleware.ts` quanto em cada API route (defesa em profundidade).
