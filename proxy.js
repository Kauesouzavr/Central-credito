import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

// Fase 10: portão de login. Roda antes de qualquer página — quem não
// estiver logado é mandado pra /login; quem já estiver logado não vê a
// tela de login de novo. Esse arquivo só cuida de redirecionar; a sessão
// em si (cookies) é gerida pelo cliente @supabase/ssr abaixo.
//
// Next.js 16 renomeou "middleware" pra "proxy" (mesma função, nome novo —
// ver node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md).
// Usamos supabase.auth.getUser() (não só ler o cookie) de propósito: é a
// recomendação oficial do @supabase/ssr, porque só o cookie pode ser
// forjado — getUser() confere direto com o servidor de autenticação.
export default async function proxy(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesParaGravar) {
        cookiesParaGravar.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesParaGravar.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const naTelaDeLogin = request.nextUrl.pathname.startsWith('/login');

  if (!user && !naTelaDeLogin) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && naTelaDeLogin) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
