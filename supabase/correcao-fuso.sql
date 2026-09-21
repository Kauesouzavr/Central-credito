-- Central de Crédito — correção de fuso horário na view titulos_com_saldo
-- Rode isso no SQL Editor do Supabase (só esta view é alterada; nenhum dado muda).
--
-- Problema: o banco roda em UTC, então current_date já virava "amanhã" a partir
-- das 21h de Brasília. Nesse horário, um título que vence hoje aparecia como
-- "atrasado", com 1 dia de atraso. Agora "hoje" é a data em America/Sao_Paulo.
--
-- As colunas da view continuam exatamente as mesmas (mesmos nomes, tipos e
-- ordem), por isso é seguro usar "create or replace".

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
