@AGENTS.md

# Decisões deste projeto (Central de Crédito)

Este bloco é nosso (não é tocado pelo `next dev`) — é onde ficam decisões de
negócio/arquitetura que valem em qualquer sessão, seja no serviço ou em casa.
Detalhes e o "porquê" de cada uma estão no README, seção "Decisões técnicas".

- **Fase atual (WhatsApp): usar Baileys** (biblioteca não-oficial, conexão
  por QR code), **não** a Cloud API oficial da Meta. Decidido porque não
  precisa de aprovação de template nem verificação de empresa — mais rápido
  pra demonstrar ao cliente agora. Implementado em `scripts/whatsapp-bot.mjs`
  (processo que fica rodando, sessão salva em `whatsapp-auth/`, nunca
  versionada). Tem limite de mensagens por hora/dia e atraso aleatório entre
  envios (`lib/limite-envio.js`, colunas `whatsapp_*` em `configuracoes`).
- **Fase de demonstração, não produção**: o projeto está sendo mostrado a um
  cliente em potencial pra fechar negócio, ainda não roda com dado real. Não
  investir tempo agora em segurança pesada (WAF, autenticação completa,
  compliance, infra cara) — o nível atual (RLS + chave `service_role` só no
  servidor) já é suficiente pra essa fase. Isso muda quando o negócio for
  fechado de fato.
