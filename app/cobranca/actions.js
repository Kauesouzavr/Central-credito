'use server';

import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '../../lib/supabase-server';

export async function alternarEnvio() {
  const supabase = getSupabaseServerClient();

  const { data: config, error: erroConfig } = await supabase
    .from('configuracoes')
    .select('whatsapp_pausado')
    .eq('id', 1)
    .single();

  if (erroConfig) {
    redirect(`/cobranca?erro=${encodeURIComponent('Erro ao ler configuração: ' + erroConfig.message)}`);
    return;
  }

  const novoValor = !config.whatsapp_pausado;
  const { error } = await supabase.from('configuracoes').update({ whatsapp_pausado: novoValor }).eq('id', 1);

  if (error) {
    redirect(`/cobranca?erro=${encodeURIComponent('Erro ao salvar: ' + error.message)}`);
    return;
  }

  redirect(`/cobranca?ok=${encodeURIComponent(novoValor ? 'Envios pausados.' : 'Envios retomados.')}`);
}
