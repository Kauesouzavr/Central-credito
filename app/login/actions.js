'use server';

import { redirect } from 'next/navigation';
import { getSupabaseUsuarioClient } from '../../lib/auth-server';

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

export async function sair() {
  const supabase = await getSupabaseUsuarioClient();
  await supabase.auth.signOut();
  redirect('/login');
}
