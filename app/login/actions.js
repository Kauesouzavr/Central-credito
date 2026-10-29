'use server';

import { redirect } from 'next/navigation';
import { getSupabaseUsuarioClient } from '../../lib/auth-server';
import { demoAtiva } from '../../lib/demo-guard';

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

// Demo pública: botão "Explorar a demonstração". Entra com o usuário
// visitante direto no servidor — e-mail e senha vêm das variáveis de ambiente
// e nunca chegam ao navegador. Sem DEMO_MODE=1 recusa (no sistema real essa
// action não faz nada).
export async function entrarNaDemo() {
  const email = process.env.DEMO_USER_EMAIL;
  const senha = process.env.DEMO_USER_PASSWORD;

  if (!demoAtiva() || !email || !senha) {
    redirect(`/login?erro=${encodeURIComponent('A demonstração não está disponível.')}`);
  }

  const supabase = await getSupabaseUsuarioClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });

  if (error) {
    redirect(`/login?erro=${encodeURIComponent('Não foi possível abrir a demonstração agora. Tente de novo em instantes.')}`);
  }

  // Mesmo upsert do login normal, só que já com o nome da loja fictícia.
  await supabase
    .from('perfis')
    .upsert({ user_id: data.user.id, nome_negocio: 'Loja Exemplo' }, { onConflict: 'user_id', ignoreDuplicates: true });

  redirect('/');
}

export async function sair() {
  const supabase = await getSupabaseUsuarioClient();
  await supabase.auth.signOut();
  redirect('/login');
}
