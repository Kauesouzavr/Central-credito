-- Central de Crédito — Fase 6: colunas de configuração da régua de WhatsApp
-- Rode isso no SQL Editor do Supabase (só em bancos criados antes da Fase 6;
-- quem rodar o schema.sql do zero já recebe essas colunas direto).
--
-- Limite de mensagens por hora/dia e atraso aleatório entre envios — pra não
-- mandar tudo em rajada, já que o envio é por Baileys (não-oficial).

alter table configuracoes
  add column if not exists whatsapp_limite_por_hora integer default 20,
  add column if not exists whatsapp_limite_por_dia integer default 100,
  add column if not exists whatsapp_atraso_min_segundos integer not null default 20,
  add column if not exists whatsapp_atraso_max_segundos integer not null default 90;
