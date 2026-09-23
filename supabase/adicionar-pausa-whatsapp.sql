-- Central de Crédito — Fase 8 (redesign): pausar a régua de WhatsApp
-- Rode isso no SQL Editor do Supabase (só em bancos criados antes desta
-- mudança; quem rodar o schema.sql do zero já recebe a coluna direto).
--
-- Dá suporte ao botão "Pausar envios" da tela de Cobrança — o bot
-- (scripts/whatsapp-bot.mjs) confere essa coluna antes de mandar cada leva
-- de mensagens.

alter table configuracoes
  add column if not exists whatsapp_pausado boolean not null default false;
