import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

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
