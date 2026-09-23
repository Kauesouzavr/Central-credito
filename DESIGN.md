# Design

<!-- impeccable:design-schema 1 -->

## Histórico

Terceira direção visual do projeto. As duas primeiras (documentadas nas
revisões anteriores deste arquivo, resumidas aqui porque o arquivo não foi
atualizado a cada pivô):

1. **"Talão de recibo com papel-carbono"** (papel creme, selos girados,
   perfuração pontilhada) — rejeitada pelo usuário na prática ("ficou
   ridículo").
2. **"Painel de gestão vinho"** (Fase 8 original: fundo neutro, cartões
   brancos, acento vinho único) — marcada como concluída no roadmap, depois
   substituída sem nunca ter sido documentada aqui.

Esta terceira direção não foi sorteada nem pinada por referência estática:
o usuário trouxe um **protótipo completo e navegável**, feito no
MagicPatterns, e pediu port idêntico pro app real — cores, gradientes,
sombras, animações, hover, tudo. O contrato completo da decisão está no
comentário HTML no primeiro filho do `<body>` em `app/layout.js`.

## World

**Painel de gestão com acento vermelho de marca.** Fundo claro com gradiente
radial vermelho muito sutil, cartões "glass" translúcidos (blur + brilho
interno), tipografia Manrope, microanimações discretas (framer-motion) na
navegação, nos modais e nas barras de progresso.

## Modo

**Operate.** Mesmo público de antes (dono de loja pequena, pessoa idosa) —
hierarquia clara acima de expressão, mas com mais textura visual que as
direções anteriores (o usuário pediu explicitamente esse nível de
acabamento, referência em mãos).

## Paleta

Tokens definidos em `tailwind.config.js` (`theme.extend.colors`):

| Token | Valor | Uso |
|---|---|---|
| `paper` | `#FAF6F4` | Fundo da página (com gradiente radial vermelho sutil) |
| `ink` / `ink-soft` / `ink-faint` | `#1E1614` / `#5B4F4C` / `#8E817E` | Texto principal / secundário / terciário |
| `line` | `#ECE2DF` | Bordas e divisores |
| `brand-50..900` | `#FFF4F2` a `#55100A` | **Acento único de marca** — vermelho. `brand-500`/`600` nos botões primários e gráficos, `brand-700` em texto de destaque/erro |
| `warn-50/100/500/700` | tons de âmbar | Risco médio, avisos |
| `ok-50/100/500/700` | tons de verde | Risco baixo, sucesso, pagamentos |

Selos de risco/status reaproveitam essas mesmas cores (`lib/risco-ui.js`,
`lib/titulo-ui.js`) — nunca uma paleta paralela.

## Tipografia

**Manrope** (Google Fonts, pesos 400–800) — trade-off consciente em relação
às direções anteriores, que usavam só fonte de sistema por carregamento
instantâneo: aqui o usuário pediu fidelidade ao protótipo, que usa Manrope
em todo lugar. `font-variant-numeric: tabular-nums` continua em todo número
de dinheiro/risco, mantido das direções anteriores.

## Componentes / motivos

- **`.glass` / `.glass-strong` / `.glass-disk`** (`app/globals.css`) —
  cartões translúcidos com blur, usados em praticamente todo painel
  (`GlassPanel`), no menu fixo e no centro do termômetro de risco.
- **`.btn-primary-surface` / `.btn-secondary-surface`** — gradiente vermelho
  com sombra que "acende" no hover (botão primário) / superfície branca com
  borda sutil (secundário). Toda variante de botão (`lib/buttonStyles.js`)
  parte daqui, nunca de cor sólida direta.
- **Selos de risco/status** — pílula sólida colorida (`RiskBadge`,
  `EtiquetaRisco`), sem rotação nem motivo decorativo — geometria limpa,
  diferente da primeira direção (carimbo torto).
- **Modais** (`Modal.jsx`, framer-motion) — bottom sheet no celular,
  centralizado com fade+scale no desktop; Escape fecha, foco preso no
  conteúdo.
- **Indicador de aba ativa** (`TopNav.jsx`) — `layoutId` do framer-motion,
  desliza entre abas em vez de trocar abruptamente.
- **Anel de risco** (`RiskRing.jsx`) e **termômetro do dia**
  (`RiskThermometer.jsx`) — gauges SVG com gradiente e glow, únicos motivos
  realmente decorativos do sistema — reservados pra risco/dinheiro, o dado
  mais importante da tela "Hoje".

## Como foi verificado

- Port feito arquivo por arquivo a partir do código-fonte exportado do
  MagicPatterns (não só a página renderizada) — classes Tailwind, props e
  estrutura JSX conferidas contra o original, com nomes de campo adaptados
  pro schema real do Supabase (`nivel`/`nota` em vez de `faixa`/`score`,
  `cliente_id`/`data_vencimento` em vez de camelCase etc.).
- `npm test` e `npm run build` conferidos depois do port completo.
- **Sem verificação visual por screenshot**, mesma limitação já registrada
  nas revisões anteriores deste arquivo: Chromium/Edge headless não funciona
  neste ambiente. Conferência visual final fica pro usuário, no
  `npm run dev` ou no deploy.

## Limitações conhecidas

- Nenhum teste automatizado cobre CSS/aparência (só lógica de negócio, como
  antes).
- Não há modo escuro.
- "Reconectar com QR code" na tela de Cobrança é só instrutivo (mostra um
  toast) — o bot do WhatsApp roda como processo separado
  (`scripts/whatsapp-bot.mjs`) e não expõe status pra web; reconectar de
  verdade continua sendo escanear o QR no terminal.
