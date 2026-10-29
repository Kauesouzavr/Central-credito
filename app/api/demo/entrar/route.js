import { NextResponse } from 'next/server';
import { demoAtiva, destinoSeguroDemo } from '../../../../lib/demo-guard';
import { entrarComoVisitante } from '../../../../lib/demo-entrada';

// Demo pública: entrada automática. Na demo, quem chega sem sessão não vê a
// tela de login: o proxy.js manda pra cá, a rota entra como o usuário
// visitante (no servidor) e devolve a pessoa pra página que ela pediu.
// Fora da demo (sem DEMO_MODE=1) a rota nem existe.
export async function GET(request) {
  if (!demoAtiva()) {
    return new Response('Not found', { status: 404 });
  }

  const url = request.nextUrl.clone();
  const destino = destinoSeguroDemo(url.searchParams.get('next'));
  url.search = '';

  const entrou = await entrarComoVisitante();
  if (!entrou) {
    // Sem loop: /login é a única página que o proxy deixa passar sem sessão.
    url.pathname = '/login';
    url.searchParams.set('erro', 'Não foi possível abrir a demonstração agora. Tente de novo em instantes.');
    return NextResponse.redirect(url);
  }

  const [caminho, busca = ''] = destino.split('?');
  url.pathname = caminho;
  url.search = busca ? `?${busca}` : '';
  return NextResponse.redirect(url);
}
