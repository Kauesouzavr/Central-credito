import './globals.css';

export const metadata = {
  title: 'Central de Crédito',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <div
          aria-hidden="true"
          style={{ display: 'none' }}
          dangerouslySetInnerHTML={{
            __html: `<!--
THESIS: app de fiado pra dona de loja idosa deve parecer o talão de
recibo de papel-carbono que ela já confia, não um SaaS genérico.
OWN-WORLD: papel creme, roxo-carbono como único acento, selos de
status tipo carimbo (girados, borda irregular), divisor pontilhado
tipo perfuração de talão, números de dinheiro tabulares.
STORY: ela abre o app e lê os números do dia como quem lê um
canhoto de recibo; aperta botões grandes e óbvios, como carimbar
"PAGO"; confia em cada número porque parece um registro de papel.
FIRST VIEWPORT: Início "Hoje" — busca, botões grandes de menu,
cartões-canhoto com friso roxo-carbono, fila de cobrança embaixo.
FORM: Talão de recibo com papel-carbono (direção #3, seed
35350451), com um traço emprestado do HyperCard: botão "carimba"
ao ser pressionado (sombra recolhe no :active).
FINISH: unreviewed and undocumented is unfinished; this build
ends with the finish review, the verdict, DESIGN.md, and every
shipping raster carrying its provenance.
-->`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
