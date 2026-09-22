# Design

<!-- impeccable:design-schema 1 -->

## World

**Talão de recibo com papel-carbono.** O app deve parecer o bloco de recibo
com papel-carbono que qualquer lojista brasileiro já usa (ou usava) pra
registrar uma venda — não um SaaS genérico. Papel creme, um único acento
(roxo-carbono), selos de status como carimbo de borracha, divisor pontilhado
tipo perfuração de talão, números de dinheiro sempre tabulares.

Contrato completo da decisão: comentário HTML no primeiro filho do `<body>`
em `app/layout.js` (visível no HTML renderizado, sobrevive ao build de
produção — confirmado por grep no `.next/server` gerado).

Direção sorteada pela skill Impeccable (`concept-seed.mjs --scope direction
--mode operate`, seed `35350451`, candidato #3 de 7 mundos visuais derivados
do público: dono(a) de loja pequena, idoso(a), Brasil). Traço emprestado do
challenger HyperCard (descartado no geral, mas doou a disciplina de botão
"obviamente clicável"): o `:active` recolhe a sombra, simulando um carimbo
batendo no papel.

## Modo

**Operate.** O visitante está completando uma tarefa (cadastrar venda,
conferir quem cobrar, ver previsão de caixa), não sendo persuadido ou
entretido. Por isso: paleta restrita (neutros + um acento só), tipografia de
sistema (zero fonte externa, carregamento instantâneo, sem flash de texto
sem estilo), hierarquia clara acima de expressão.

## Paleta

Estratégia: **Restrita** (neutros + um acento), a padrão pra Operate.

| Token | Valor | Uso |
|---|---|---|
| `--papel` | `#f7f1e4` | Fundo da página |
| `--papel-cartao` | `#fffdf6` | Fundo de cartões, inputs, itens de lista |
| `--linha` | `#ddd0b2` | Bordas discretas, divisores |
| `--linha-forte` | `#c9b98e` | Bordas de input, linha de cabeçalho de tabela |
| `--tinta` | `#2b2620` | Texto principal |
| `--tinta-suave` | `#6b6255` | Texto secundário (rótulos, legendas) |
| `--carbono` | `#4b3b6b` | **Único acento de marca** — links, botão primário, friso de cartão |
| `--carbono-escuro` | `#382c50` | Hover/active do acento |
| `--carbono-fundo` | `#ece7f5` | Fundo suave do acento (hover de item de lista, caixa de destaque) |

Selos de status (mesma família de cor do sistema de risco já existente —
vermelho/âmbar/verde, só com tons mais quentes/"tinta" que o material design
genérico de antes):

| Papel | Tinta | Fundo |
|---|---|---|
| Alto risco / atrasado | `#8a2e22` | `#fbe9e2` |
| Médio risco | `#8a5a12` | `#fbf0da` |
| Baixo risco / pago | `#2e6b3e` | `#e6f2e3` |

Contraste conferido pela fórmula WCAG (sem ferramenta de screenshot
disponível neste ambiente — ver "Como foi verificado" abaixo): texto
secundário sobre papel ≈ 5,3:1, texto branco sobre botão primário ≈ 9,8:1 —
os dois acima do mínimo de 4,5:1 (AA, texto normal).

## Tipografia

`system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` — mantido do
design anterior de propósito. Nenhuma fonte web: carrega na hora, sem
dependência externa, legível em qualquer sistema operacional. Hierarquia
feita por peso (800 nos títulos, 700 nos rótulos/botões) e tamanho, não por
troca de família. `font-variant-numeric: tabular-nums` em todo número de
dinheiro (cartões, tabela de títulos, gráfico), pra colunas de valor
alinharem visualmente.

## Componentes / motivos

- **`.cartao`** — canhoto de recibo: fundo `--papel-cartao`, friso esquerdo
  de 4px em `--carbono`, sombra baixa (`--sombra-cartao`).
- **`.selo` / `.etiqueta-risco`** — carimbo: rotação -2°, `border-radius`
  assimétrico (`3px 8px 3px 8px`, imita carimbo batendo torto), maiúsculas,
  borda de 2px na cor do status. Cor só aparece aqui e no acento — nunca
  decorativa.
- **Botões** — grandes, com sombra de 3px que recolhe no `:active`
  (`translateY(3px)`), simulando o carimbo pressionando o papel. Foco
  visível (`:focus-visible`, 3px, cor do acento) em todo elemento
  interativo.
- **Divisores** — `border-bottom: 1px dashed` nas linhas de tabela e nas
  linhas de ação, lembrando a perfuração de um talão.

## Como foi verificado

- `npm test` (91 testes) e `npm run build` (produção) passaram limpos.
- Grep no HTML gerado (`.next/server/app`) confirma que o comentário de
  decisão sobrevive ao build.
- Contraste de cor conferido por cálculo manual (fórmula de luminância
  relativa WCAG), não por ferramenta automática.
- **Sem verificação visual por screenshot**: o Chromium/Edge headless não
  funcionou neste ambiente (travava sem gerar o arquivo, mesmo em modo
  headless clássico e com perfil isolado) e não havia `chromium-cli` nem
  gerador de imagem disponível. Essa é uma substituição em relação ao
  processo padrão da skill — revisão visual real fica pendente do usuário
  conferir no deploy da Vercel.
- **Sem detector mecânico da skill** (`detect.mjs`): não veio empacotado
  nesta instalação (`Error: bundled detector not found`). Revisão manual do
  CSS/JSX feita no lugar dele.

## Limitações conhecidas

- Nenhum teste automatizado cobre CSS/aparência (só lógica de negócio).
- Não há modo escuro — decisão consciente: o público-alvo (loja física,
  pessoa idosa) não tem sinal de precisar disso agora, e o metáfora de
  "papel" não tem correspondente escuro natural. Revisitar se pedido.
- Ícone/favicon do app ainda não existe.
