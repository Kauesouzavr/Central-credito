import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';

// Cliente Supabase autenticado como a pessoa logada (via cookie de sessão,
// gerido pelo middleware). Ao contrário de getSupabaseServerClient
// (service_role, ignora RLS), este respeita RLS — é o que faz login/logout
// funcionarem e, na Fase 10 parte 2, vai ler/escrever só os dados da
// empresa de quem está logado.
export async function getSupabaseUsuarioClient() {
  const cookieStore = await cookies();

  return createServerClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesParaGravar) {
        try {
          cookiesParaGravar.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Chamado de dentro de um Server Component (não pode gravar
          // cookie) — sem problema, o middleware já renova a sessão.
        }
      },
    },
  });
}

// Defesa em profundidade: o proxy.js já manda quem não está logado pra
// /login, mas Server Actions e Route Handlers são endpoints POST/GET que
// podem ser chamados direto. Cada um confere a sessão de novo antes de
// tocar no banco com a chave service_role (que ignora RLS).
export async function exigirLogin() {
  const supabase = await getSupabaseUsuarioClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return user;
}
