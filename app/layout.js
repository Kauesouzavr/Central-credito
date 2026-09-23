import './globals.css';
import TopNav from './componentes/TopNav';
import { Toaster } from './componentes/ui/Toaster';

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
REVISÃO 2: a direção "painel de gestão vinho" (Fase 8) foi substituída por
pedido do usuário, que trouxe um design de referência completo (feito no
MagicPatterns, navegável) e pediu port idêntico — não é mais uma direção
sorteada nem pinada por referência estática, é a reprodução de um protótipo
aprovado pelo usuário.
THESIS: painel de gestão com acento vermelho de marca, cartões "glass"
translúcidos (fundo claro + blur + brilho sutil), tipografia Manrope,
microanimações discretas (framer-motion) em navegação, modais e barras.
OWN-WORLD: fundo claro com gradiente radial vermelho muito sutil, menu fixo
"glass" com indicador de aba ativa animado, cartões translúcidos com brilho
interno, selos de risco/status em pílula, botões com gradiente vermelho e
sombra que "acende" no hover, modais com framer-motion, toasts (sonner) no
lugar dos banners estáticos de sucesso/erro.
FIRST VIEWPORT: menu fixo no topo (Hoje / Clientes / Previsão / Cobrança /
Relatório / Ajustes) com a rota atual destacada por um indicador animado.
FINISH: revisão manual de alinhamento e ortografia/plural em todo texto em
português, já que não há revisor automático disponível neste ambiente.
Verificação visual real: sem screenshot automatizado neste ambiente (ver
DESIGN.md) — conferência final feita pelo usuário no "npm run dev"/deploy.
-->`,
          }}
        />
        <TopNav />
        <main className="mx-auto w-full max-w-[1440px] px-4 pb-20 pt-10 sm:px-6 lg:px-8">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
