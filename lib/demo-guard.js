// Demo pública: trava de segurança. Funções puras (recebem as variáveis de
// ambiente, não leem process.env sozinhas) pra serem testáveis.
//
// Tudo que é "da demo" (aviso, botão de entrar, rota de reset) só existe com
// DEMO_MODE === "1". E qualquer operação que apaga ou insere dados em massa
// só é autorizada se, além disso, o SUPABASE_URL apontar EXATAMENTE pro
// projeto da demo (DEMO_SUPABASE_REF + ".supabase.co") — assim, mesmo que
// alguém coloque DEMO_MODE=1 por engano num ambiente com as chaves do banco
// real, a trava recusa.

export function demoAtiva(env = process.env) {
  return env.DEMO_MODE === '1';
}

export function operacaoDestrutivaAutorizada(env = process.env) {
  if (!demoAtiva(env)) return false;

  const ref = String(env.DEMO_SUPABASE_REF ?? '').trim();
  const url = String(env.SUPABASE_URL ?? '').trim();
  if (!ref || !url) return false;

  let host;
  try {
    // `host` inclui a porta (se houver), então "x.supabase.co:8080" não passa.
    host = new URL(url).host;
  } catch {
    return false;
  }

  return host === `${ref}.supabase.co`;
}
