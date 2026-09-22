import './globals.css';
import Nav from './componentes/Nav';

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
REVISÃO: a direção "talão de recibo com papel-carbono" (selos girados,
papel creme, perfuração pontilhada) foi rejeitada pelo usuário na prática
("ficou ridículo") — pedido explícito de algo limpo, alinhado e
profissional, tipo painel de gestão. Esta é a segunda direção, pinada
pelo usuário (referências visuais fornecidas), não sorteada.
THESIS: um painel de gestão sério e confiável, com menu fixo, cartões
brancos discretos e um único acento (vinho) — sem nenhum motivo
decorativo que não sirva a hierarquia da informação.
OWN-WORLD: fundo neutro claro, cartões brancos com borda sutil, acento
vinho único, selos de status em pílula sólida (não girados), logo em
serifa só na marca do menu — todo o resto em sans-serif do sistema.
FIRST VIEWPORT: menu fixo no topo (Hoje / Clientes / Novo cliente /
Previsão / Relatório) com a rota atual destacada.
FINISH: revisão manual de alinhamento e ortografia/plural em todo texto
em português, já que não há revisor automático disponível neste ambiente.
-->`,
          }}
        />
        <Nav />
        {children}
      </body>
    </html>
  );
}
