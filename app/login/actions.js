'use server';

import { redirect } from 'next/navigation';
import { getSupabaseUsuarioClient } from '../../lib/auth-server';
import { entrarComoVisitante } from '../../lib/demo-entrada';

export async function entrar(formData) {
  const email = (formData.get('email') || '').toString().trim();
  const senha = (formData.get('senha') || '').toString();

  if (!email || !senha) {
    redirect(`/login?erro=${encodeURIComponent('Preencha e-mail e senha.')}`);
  }

  const supabase = await getSupabaseUsuarioClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    redirect(`/login?erro=${encodeURIComponent('E-mail ou senha incorretos.')}`);
  }

  // Primeiro login dessa conta: cria o perfil sozinho, com o nome padrão.
  // Logins seguintes não mexem nele (ignoreDuplicates), pra não apagar um
  // nome que já foi trocado.
  await supabase.from('perfis').upsert({ user_id: data.user.id }, { onConflict: 'user_id', ignoreDuplicates: true });

  redirect('/');
}

// Demo pública: botão "Explorar a demonstração" da tela /login (reserva: na
// demo o proxy já entra sozinho, ver app/api/demo/entrar/route.js). Sem
// DEMO_MODE=1 recusa — no sistema real essa action não faz nada.
export async function entrarNaDemo() {
  const entrou = await entrarComoVisitante();
  if (!entrou) {
    redirect(`/login?erro=${encodeURIComponent('Não foi possível abrir a demonstração agora. Tente de novo em instantes.')}`);
  }
  redirect('/');
}

export async function sair() {
  const supabase = await getSupabaseUsuarioClient();
  await supabase.auth.signOut();
  redirect('/login');
}
