-- Central de Crédito — Fase 10 (login, parte 1): tabela de perfis.
-- Rode isso no SQL Editor do Supabase.
--
-- Guarda só o nome do negócio de cada conta logada (Supabase Auth cuida do
-- resto: e-mail, senha, sessão). Uma linha por usuário, criada sozinha no
-- primeiro login (ver app/login/actions.js).

create table if not exists perfis (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nome_negocio text not null default 'Minha Empresa',
  criado_em timestamptz not null default now()
);

alter table perfis enable row level security;

-- Cada conta só enxerga e mexe no próprio perfil — a primeira política
-- "de verdade" do projeto (as outras tabelas continuam RLS-ligado-sem-
-- política, bloqueando só a chave anon; aqui o acesso é feito com a sessão
-- da própria pessoa, então a política precisa valer de verdade).
create policy "cada um ve o proprio perfil" on perfis
  for select using (auth.uid() = user_id);

create policy "cada um cria o proprio perfil" on perfis
  for insert with check (auth.uid() = user_id);

create policy "cada um edita o proprio perfil" on perfis
  for update using (auth.uid() = user_id);
