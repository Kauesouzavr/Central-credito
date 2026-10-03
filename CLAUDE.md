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

## Pendências que custam dinheiro (resolver só quando o cliente fechar e pagar)

Sem orçamento agora pra investir nisso — registrado aqui pra não esquecer e
pra entrar na proposta comercial quando o negócio fechar. Qualquer infra paga
nova (hosting, API, plano de banco) entra nesta lista em vez de ser decidida
e paga sozinha no meio do trabalho. Preços são estimativa (2026-10-02),
conferir valor atual na hora de contratar. Ordenado por prioridade.

### Essenciais pra virar produção de verdade

- **Banco de dados (Supabase) — plano pago**: hoje é o plano gratuito, que
  **pausa o projeto sozinho depois de ~1 semana sem uso** (inaceitável pra
  ferramenta que precisa estar sempre no ar) e não tem backup diário
  automático — com dado financeiro real de cliente, perder isso é grave. O
  plano Pro (~US$25/mês, uns R$130-150) tira o auto-pause e dá backup diário.
  É o item mais crítico da lista.
- **Hospedagem do site (Vercel) — plano pago**: o endereço atual
  (`central-credito.vercel.app`) é o subdomínio padrão do plano gratuito
  (Hobby) — os termos da Vercel geralmente restringem esse plano a uso
  pessoal/não-comercial (conferir os termos atuais ao decidir). O plano Pro
  (~US$20/mês por pessoa, uns R$110) libera uso comercial de verdade.
- **Bot do WhatsApp depende do PC ligado** (2026-10-02): hoje o bot
  (`scripts/whatsapp-bot.mjs`, Baileys) só funciona com o computador do
  desenvolvedor ligado e o processo rodando — desligou, para a cobrança
  automática, e nesse dia (01→02/10) ele ficou **travado "vivo" por 8h sem
  mandar nada**, sem nem cair (bug separado dos de queda/crash, que a tarefa
  agendada do Windows já cobre). Decisão (2026-10-03): por enquanto o bot
  roda só neste PC do trabalho, até o negócio fechar. Resolve com um dos dois:
  - **VPS barato sempre ligado** (~R$20-30/mês, ex.: Oracle Cloud tem camada
    grátis) rodando o mesmo código Baileys — mais rápido de fazer, não muda
    a integração que já funciona.
  - **Trocar pra WhatsApp Cloud API oficial (Meta)** — roda 100% na nuvem
    (sem processo separado, sem QR code), mas exige verificação de empresa e
    aprovação de template (dias) e tem custo por mensagem depois do limite
    grátis. É a opção que também mudaria a decisão "usar Baileys" acima.
- **Domínio próprio**: ~R$40-60/ano (ex.: `centraldecredito.com.br`) em vez
  do endereço genérico `vercel.app` — passa mais confiança mostrando pro
  cliente final, e o certificado SSL já vem de graça junto com a Vercel.

### Bom ter, conforme o negócio cresce

- **LGPD / aviso de privacidade**: o sistema guarda nome, telefone,
  endereço e situação financeira de clientes reais — vale uma consulta
  jurídica rápida pra um aviso de privacidade básico e confirmar que o uso
  está dentro da lei, antes de rodar com dado real de verdade.
- **Monitoramento com alerta**: pra não repetir o que aconteceu em
  2026-10-02 (bot travado 8h sem mandar nada e ninguém percebeu) — um
  serviço de monitoramento (várias opções têm camada gratuita) avisando por
  e-mail/WhatsApp se o bot ou o site pararem de responder.
