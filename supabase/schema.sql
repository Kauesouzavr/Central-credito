-- Central de Crédito — Fase 1: fundação do banco de dados
-- Rode isso inteiro no SQL Editor do seu projeto Supabase.

create extension if not exists pgcrypto;

-- ========== CLIENTES ==========
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text not null,
  telefone_reserva text,
  segmento text,
  criado_em timestamptz not null default now()
);

-- ========== TÍTULOS ==========
-- Um cliente pode ter vários títulos abertos ao mesmo tempo — é a estrutura padrão.
create table if not exists titulos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  produto text not null,
  valor numeric(12,2) not null check (valor > 0),
  data_venda date not null default current_date,
  data_vencimento date not null,
  forma_pagamento text not null check (
    forma_pagamento in ('PIX','Boleto','Dinheiro','Cartão','Cheque','A combinar')
  ),
  criado_em timestamptz not null default now()
);

-- ========== PAGAMENTOS ==========
-- Tabela própria (em vez de um campo único acumulado): cada pagamento parcial
-- vira uma linha, com sua própria data e forma de pagamento. valor_pago do
-- título passa a ser calculado (ver view mais abaixo), não mais um número
-- que alguém atualiza na mão.
create table if not exists pagamentos (
  id uuid primary key default gen_random_uuid(),
  titulo_id uuid not null references titulos(id) on delete cascade,
  valor numeric(12,2) not null check (valor > 0),
  forma_pagamento text not null check (
    forma_pagamento in ('PIX','Boleto','Dinheiro','Cartão','Cheque','A combinar')
  ),
  data_pagamento date not null default current_date,
  criado_em timestamptz not null default now()
);

-- ========== MENSAGENS ==========
create table if not exists mensagens (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  titulo_id uuid references titulos(id) on delete cascade,
  tipo text not null check (
    tipo in ('cadastro','nova_compra','antes_vencimento','vencimento','atraso','pagamento_parcial')
  ),
  texto text not null,
  status text not null default 'pendente' check (status in ('pendente','enviada','erro')),
  enviado_em timestamptz,
  criado_em timestamptz not null default now()
);

-- ========== CONFIGURAÇÕES ==========
-- Linha única (id sempre 1) com todos os números que a Fase 3 usa na fórmula
-- de risco. Nota: "dias_atraso_risco" (Fase 1) e "limite_atraso" (Fase 3) do
-- documento original eram o mesmo conceito — unifiquei num campo só
-- (limite_atraso) pra não ter dois campos fazendo a mesma coisa.
-- Os valores abaixo são defaults de partida; a Fase 9 é justamente ajustar
-- isso com dados reais.
create table if not exists configuracoes (
  id integer primary key default 1,
  dias_antes_aviso integer not null default 3,
  dias_repetir_cobranca integer not null default 7,
  limite_atraso integer not null default 15,
  peso_mudanca_padrao numeric(5,2) not null default 20,
  corte_risco_alto numeric(5,2) not null default 55,
  corte_risco_medio numeric(5,2) not null default 25,
  constraint configuracoes_linha_unica check (id = 1)
);

insert into configuracoes (id) values (1) on conflict (id) do nothing;

-- ========== ÍNDICES ==========
create index if not exists idx_titulos_cliente_id on titulos(cliente_id);
create index if not exists idx_pagamentos_titulo_id on pagamentos(titulo_id);
create index if not exists idx_mensagens_cliente_id on mensagens(cliente_id);
create index if not exists idx_mensagens_titulo_id on mensagens(titulo_id);

-- ========== VIEW: título com saldo calculado ==========
-- valor_pago, valor_restante, dias_atraso e status, prontos pra Fase 2 (ficha
-- do cliente) usar direto, sem cada tela ter que recalcular isso na mão.
-- "Hoje" é a data em America/Sao_Paulo (o banco roda em UTC; com current_date,
-- a partir das 21h de Brasília o título que vence hoje já aparecia atrasado).
-- Em bancos já criados, a correção está em supabase/correcao-fuso.sql.
create or replace view titulos_com_saldo as
select
  t.*,
  coalesce(p.total_pago, 0) as valor_pago,
  round(t.valor - coalesce(p.total_pago, 0), 2) as valor_restante,
  case
    when t.valor - coalesce(p.total_pago, 0) <= 0 then 0
    else greatest(0, h.hoje - t.data_vencimento)
  end as dias_atraso,
  case
    when t.valor - coalesce(p.total_pago, 0) <= 0 then 'pago'
    when h.hoje > t.data_vencimento then 'atrasado'
    else 'em_aberto'
  end as status
from titulos t
cross join (select (now() at time zone 'America/Sao_Paulo')::date as hoje) h
left join (
  select titulo_id, sum(valor) as total_pago
  from pagamentos
  group by titulo_id
) p on p.titulo_id = t.id;

-- ========== SEGURANÇA ==========
-- O app não tem tela de login (decisão já tomada), então não existe "usuário
-- logado" pra basear políticas de RLS. Em vez disso: RLS ligado e sem nenhuma
-- política — isso bloqueia totalmente a chave "anon" (a que poderia vazar no
-- navegador). Toda leitura/escrita real acontece do lado do servidor
-- (Next.js), usando a chave "service_role", que sempre ignora RLS.
alter table clientes enable row level security;
alter table titulos enable row level security;
alter table pagamentos enable row level security;
alter table mensagens enable row level security;
alter table configuracoes enable row level security;
