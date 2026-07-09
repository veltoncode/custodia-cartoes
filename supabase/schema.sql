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

-- Tabela de cartões custodiados
create table if not exists cartoes (
  id uuid primary key default gen_random_uuid(),
  cpf text not null,
  nome text not null,
  agencia text not null,
  cc text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists cartoes_cpf_idx on cartoes (cpf);

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
insert into cartoes (cpf, nome, agencia, cc) values
  ('111.222.333-44', 'BEATRIZ ALMEIDA COSTA', '91', '204.118-5'),
  ('222.333.444-55', 'CARLOS EDUARDO NUNES', '91', '318.902-2'),
  ('333.444.555-66', 'DÉBORA LIMA FERREIRA', '91', '129.774-8')
on conflict (cpf) do nothing;
