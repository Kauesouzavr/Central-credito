import { createClient } from '@supabase/supabase-js';

// Cliente Supabase para uso exclusivo no servidor (Server Components,
// Server Actions, Route Handlers). Usa a chave service_role, que ignora
// RLS — por isso este arquivo nunca deve ser importado em código que roda
// no navegador.
export function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Faltam SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no .env.local'
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
