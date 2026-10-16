-- Rode este script inteiro no Supabase: Project > SQL Editor > New query

create extension if not exists "pgcrypto";

-- Tabela de usuários (funcionários que acessam o sistema)
create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text not null,
  nome text not null,
  role text not null check (role in ('admin', 'consulta')),
  created_at timestamptz default now()
);

-- Tabela de cartões custodiados (apenas nomes, em conformidade com a LGPD)
create table if not exists cartoes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists cartoes_nome_idx on cartoes (nome);

-- Segurança: habilita RLS e não cria nenhuma policy pública.
-- O backend do app acessa essas tabelas com a service_role key
-- (que ignora RLS), então o Supabase nunca fica exposto ao público.
alter table usuarios enable row level security;
alter table cartoes enable row level security;

-- Trigger simples para manter updated_at em dia
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_cartoes_updated_at on cartoes;
create trigger trg_cartoes_updated_at
before update on cartoes
for each row execute function set_updated_at();

-- (Opcional) dados de exemplo — remova se não quiser
insert into cartoes (nome) values
  ('BEATRIZ ALMEIDA COSTA'),
  ('CARLOS EDUARDO NUNES'),
  ('DÉBORA LIMA FERREIRA');

-- Caso você já possua a tabela cartoes criada no Supabase e queira migrar (remover dados de CPF, Agência e C/C):
-- alter table cartoes drop column if exists cpf;
-- alter table cartoes drop column if exists agencia;
-- alter table cartoes drop column if exists cc;
-- drop index if exists cartoes_cpf_idx;
-- create index if not exists cartoes_nome_idx on cartoes (nome);
