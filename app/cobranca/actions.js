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

export async function alternarEnvioAutomatico() {
  const supabase = getSupabaseServerClient();

  const { data: config, error: erroConfig } = await supabase
    .from('configuracoes')
    .select('whatsapp_envio_automatico')
    .eq('id', 1)
    .single();

  if (erroConfig) {
    redirect(`/cobranca?erro=${encodeURIComponent('Erro ao ler configuração: ' + erroConfig.message)}`);
    return;
  }

  const novoValor = !config.whatsapp_envio_automatico;
  const { error } = await supabase.from('configuracoes').update({ whatsapp_envio_automatico: novoValor }).eq('id', 1);

  if (error) {
    redirect(`/cobranca?erro=${encodeURIComponent('Erro ao salvar: ' + error.message)}`);
    return;
  }

  redirect(
    `/cobranca?ok=${encodeURIComponent(
      novoValor
        ? 'Envio automático ligado. As mensagens da régua saem sozinhas.'
        : 'Envio automático desligado. As mensagens da régua agora esperam aprovação.'
    )}`
  );
}

// Aprova uma mensagem que estava esperando revisão (Fase 9): ela sai
// 'pendente' e é mandada no próximo ciclo do bot (scripts/whatsapp-bot.mjs) —
// o site não fala com o Baileys diretamente, são processos separados.
export async function aprovarEnvio(formData) {
  const mensagemId = (formData.get('mensagem_id') || '').toString().trim();

  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from('mensagens')
    .update({ status: 'pendente' })
    .eq('id', mensagemId)
    .eq('status', 'pendente_revisao');

  if (error) {
    redirect(`/cobranca?erro=${encodeURIComponent('Erro ao aprovar mensagem: ' + error.message)}`);
    return;
  }

  redirect(`/cobranca?ok=${encodeURIComponent('Mensagem aprovada. Sai no próximo ciclo do bot.')}`);
}
