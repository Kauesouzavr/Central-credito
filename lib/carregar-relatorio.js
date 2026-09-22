import { buscarTudo } from './carregar-risco.js';
import { montarRelatorio } from './relatorio.js';
import { dataBrasil, hojeBrasil, inicioDoDiaBrasil, somarDias } from './util.js';

// Lê do banco só o que cabe na janela de 2 semanas (semana atual + anterior,
// pra comparação) e monta o relatório. Uma falha aqui não derruba a tela.
export async function carregarRelatorio(supabase) {
  try {
    const hoje = hojeBrasil();
    const inicioJanela = somarDias(hoje, -13); // semana atual + a anterior

    const [titulos, pagamentos, clientesBrutos, mensagensBrutas] = await Promise.all([
      buscarTudo(() =>
        supabase
          .from('titulos_com_saldo')
          .select('valor, data_venda, data_vencimento, status')
          .or(`data_venda.gte.${inicioJanela},data_vencimento.gte.${inicioJanela}`)
          .order('id')
      ),
      buscarTudo(() =>
        supabase.from('pagamentos').select('valor, data_pagamento').gte('data_pagamento', inicioJanela).order('id')
      ),
      buscarTudo(() =>
        supabase.from('clientes').select('criado_em').gte('criado_em', inicioDoDiaBrasil(inicioJanela)).order('id')
      ),
      buscarTudo(() =>
        supabase
          .from('mensagens')
          .select('tipo, status, enviado_em')
          .eq('status', 'enviada')
          .gte('enviado_em', inicioDoDiaBrasil(inicioJanela))
          .order('id')
      ),
    ]);

    const clientes = clientesBrutos.map((c) => ({ data_cadastro: dataBrasil(c.criado_em) }));
    const mensagens = mensagensBrutas.map((m) => ({
      tipo: m.tipo,
      status: m.status,
      data_envio: dataBrasil(m.enviado_em),
    }));

    const resumo = montarRelatorio({ titulos, pagamentos, clientes, mensagens, hoje });
    return { resumo, erro: null };
  } catch (e) {
    return { resumo: null, erro: e.message || 'erro desconhecido' };
  }
}
