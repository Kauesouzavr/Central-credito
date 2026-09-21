'use server';

import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '../lib/supabase-server';
import { MARCA_COBRANCA_MANUAL } from '../lib/hoje';
import { lerCampo, plural } from '../lib/util';

// Volta pra tela "Hoje", opcionalmente com uma mensagem de sucesso (ok) ou de
// erro (erro) no topo.
function voltarParaHoje(tipo, mensagem) {
  const query = mensagem ? `?${tipo}=${encodeURIComponent(mensagem)}` : '';
  redirect(`/${query}`);
}

// Botão "Já cobrei": grava que o cliente foi cobrado agora. Ele sai da fila
// por `dias_repetir_cobranca` dias.
export async function registrarCobranca(formData) {
  const clienteId = lerCampo(formData, 'cliente_id');

  const supabase = getSupabaseServerClient();

  const { data: cliente, error: erroCliente } = await supabase
    .from('clientes')
    .select('id, nome')
    .eq('id', clienteId)
    .single();

  if (erroCliente || !cliente) {
    voltarParaHoje('erro', 'Cliente não encontrado.');
  }

  // Clique duplo: se acabou de ser registrada uma cobrança desse cliente, não
  // registra outra.
  const { data: recentes, error: erroRecentes } = await supabase
    .from('mensagens')
    .select('id')
    .eq('cliente_id', clienteId)
    .eq('tipo', 'atraso')
    .eq('status', 'enviada')
    .gte('enviado_em', new Date(Date.now() - 60 * 1000).toISOString())
    .limit(1);

  if (erroRecentes) {
    voltarParaHoje('erro', 'Erro ao registrar a cobrança: ' + erroRecentes.message);
  }

  if (recentes.length === 0) {
    const { error } = await supabase.from('mensagens').insert({
      cliente_id: clienteId,
      tipo: 'atraso',
      texto: MARCA_COBRANCA_MANUAL,
      status: 'enviada',
      enviado_em: new Date().toISOString(),
    });

    if (error) {
      voltarParaHoje('erro', 'Erro ao registrar a cobrança: ' + error.message);
    }
  }

  const { data: config } = await supabase
    .from('configuracoes')
    .select('dias_repetir_cobranca')
    .eq('id', 1)
    .single();
  const dias = config ? Number(config.dias_repetir_cobranca) : null;

  voltarParaHoje(
    'ok',
    dias
      ? `Cobrança de ${cliente.nome} registrada. Esse cliente sai da fila por ${dias} ${plural(dias, 'dia', 'dias')}.`
      : `Cobrança de ${cliente.nome} registrada.`
  );
}

// Botão "Desfazer" (caso o "Já cobrei" tenha sido clicado por engano). Só apaga
// cobranças feitas pelo botão, nunca mensagens enviadas pelo sistema.
export async function desfazerCobranca(formData) {
  const cobrancaId = lerCampo(formData, 'cobranca_id');

  const supabase = getSupabaseServerClient();

  const { error } = await supabase
    .from('mensagens')
    .delete()
    .eq('id', cobrancaId)
    .eq('texto', MARCA_COBRANCA_MANUAL);

  if (error) {
    voltarParaHoje('erro', 'Erro ao desfazer a cobrança: ' + error.message);
  }

  voltarParaHoje('ok', 'Cobrança desfeita: o cliente voltou para a fila.');
}
