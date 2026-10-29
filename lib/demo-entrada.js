import { getSupabaseUsuarioClient } from './auth-server';
import { demoAtiva } from './demo-guard';

// Demo pública: entra como o usuário visitante, no servidor. E-mail e senha
// vêm das variáveis de ambiente e nunca chegam ao navegador. Usado pelo botão
// da tela /login (Server Action) e pela entrada automática
// (app/api/demo/entrar/route.js). Devolve true se a sessão foi aberta.
// Sem DEMO_MODE=1 não faz nada (no sistema real isso nunca entra sozinho).
export async function entrarComoVisitante() {
  const email = process.env.DEMO_USER_EMAIL;
  const senha = process.env.DEMO_USER_PASSWORD;
  if (!demoAtiva() || !email || !senha) return false;

  const supabase = await getSupabaseUsuarioClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) return false;

  // Mesmo upsert do login normal, só que já com o nome da loja fictícia.
  await supabase
    .from('perfis')
    .upsert({ user_id: data.user.id, nome_negocio: 'Loja Exemplo' }, { onConflict: 'user_id', ignoreDuplicates: true });

  return true;
}
