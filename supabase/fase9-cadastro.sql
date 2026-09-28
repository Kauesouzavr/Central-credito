-- Central de Crédito — Fase 9: endereço estruturado e aprovação manual de envio
-- Rode isso no SQL Editor do Supabase (só em bancos criados antes da Fase 9;
-- quem rodar o schema.sql do zero já recebe essas colunas direto).

-- Endereço: "Bairro ou cidade" (coluna única `segmento`) vira campos
-- separados, preenchidos por busca de CEP (ViaCEP) no cadastro.
alter table clientes
  add column if not exists cep text,
  add column if not exists bairro text,
  add column if not exists cidade text,
  add column if not exists endereco text,
  add column if not exists numero text;

update clientes set cidade = segmento where segmento is not null and cidade is null;

alter table clientes drop column if exists segmento;

-- Envio 100% automático dos gatilhos da régua (aviso antes do vencimento,
-- vencimento, atraso): desligado, as mensagens da régua ficam esperando
-- aprovação em /cobranca em vez de saírem sozinhas.
alter table configuracoes
  add column if not exists whatsapp_envio_automatico boolean not null default true;

alter table mensagens drop constraint if exists mensagens_status_check;
alter table mensagens add constraint mensagens_status_check
  check (status in ('pendente','pendente_revisao','enviada','erro'));
