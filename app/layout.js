import './globals.css';
import TopNav from './componentes/TopNav';
import { Toaster } from './componentes/ui/Toaster';
import AvisoDemo from './componentes/demo/AvisoDemo';
import { getSupabaseUsuarioClient } from '../lib/auth-server';
import { demoAtiva } from '../lib/demo-guard';

// Demo pública: link da faixa do topo (README do repositório).
const LINK_README = 'https://github.com/Kauesouzavr/Central-credito#readme';

export const metadata = {
  title: 'Central de Crédito',
};

// Busca o nome do negócio de quem está logado, pro TopNav. Sem sessão (tela
// de login), devolve null — o TopNav nem aparece nessa tela.
async function buscarNomeNegocio() {
  const supabase = await getSupabaseUsuarioClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase.from('perfis').select('nome_negocio').eq('user_id', user.id).single();
  return perfil?.nome_negocio || 'Minha Empresa';
}

export default async function RootLayout({ children }) {
  const nomeNegocio = await buscarNomeNegocio();
  // Lido aqui, no servidor, a cada requisição: nada disso vai pro navegador
  // além do resultado (o aviso e a faixa só existem com DEMO_MODE=1).
  const demo = demoAtiva();

  return (
    <html lang="pt-BR">
      <body>
        {demo && <AvisoDemo />}
        {demo && (
          <div className="bg-ink px-4 py-2 text-center text-sm font-medium text-white">
            Demonstração com dados fictícios, restaurados todo dia. Nenhuma mensagem de WhatsApp é enviada.{' '}
            <a
              href={LINK_README}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-brand-200 underline underline-offset-2 hover:text-white"
            >
              Ver o README
            </a>
          </div>
        )}
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
        <TopNav nomeNegocio={nomeNegocio} demo={demo} />
        <main className="mx-auto w-full max-w-[1440px] px-4 pb-20 pt-10 sm:px-6 lg:px-8">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
