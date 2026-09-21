import { buscarTudo, carregarRiscos } from './carregar-risco';
import { montarHoje } from './hoje';
import { hojeBrasil } from './util';

// Lê do banco tudo que a tela "Hoje" precisa e devolve { resumo, erro }.
// Uma falha aqui não derruba a página inicial: quem chama mostra o aviso e
// segue mostrando a busca e os botões.
export async function carregarHoje(supabase) {
  try {
    const { riscoDe, titulos, config, erro } = await carregarRiscos(supabase);
    if (erro) throw new Error(erro);

    const clientes = await buscarTudo(() =>
      supabase.from('clientes').select('id, nome, telefone').order('id')
    );

    // Cobranças já feitas: as do botão "Já cobrei" e, na Fase 6, as mensagens
    // de atraso enviadas pelo WhatsApp.
    const cobrancas = await buscarTudo(() =>
      supabase
        .from('mensagens')
        .select('id, cliente_id, enviado_em, texto')
        .eq('tipo', 'atraso')
        .eq('status', 'enviada')
        .order('id')
    );

    const resumo = montarHoje({
      titulos,
      clientes,
      cobrancas,
      riscoDe,
      diasRepetirCobranca: Number(config.dias_repetir_cobranca),
      hoje: hojeBrasil(),
    });
    return { resumo, erro: null };
  } catch (e) {
    return { resumo: null, erro: e.message || 'erro desconhecido' };
  }
}
