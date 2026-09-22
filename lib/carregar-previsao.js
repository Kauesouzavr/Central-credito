import { buscarTudo, carregarRiscos } from './carregar-risco.js';
import { montarPrevisao } from './previsao.js';
import { hojeBrasil } from './util.js';

// Lê do banco tudo que a previsão de caixa precisa e devolve { resumo, erro }.
// Uma falha aqui não derruba a página: quem chama mostra o aviso.
export async function carregarPrevisao(supabase) {
  try {
    const { riscoDe, titulos, erro } = await carregarRiscos(supabase);
    if (erro) throw new Error(erro);

    const clientes = await buscarTudo(() =>
      supabase.from('clientes').select('id, nome').order('id')
    );

    const resumo = montarPrevisao({ titulos, clientes, riscoDe, hoje: hojeBrasil() });
    return { resumo, erro: null };
  } catch (e) {
    return { resumo: null, erro: e.message || 'erro desconhecido' };
  }
}
