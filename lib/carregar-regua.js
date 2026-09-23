import { carregarRiscos } from './carregar-risco.js';
import { dataBrasil, hojeBrasil } from './util.js';

function horaBrasil(instante) {
  return Number(new Date(instante).toLocaleString('en-US', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hourCycle: 'h23' }));
}

// Lê a configuração e as mensagens recentes pra tela de Cobrança: o feed
// (programadas + já enviadas) e os contadores de uso do WhatsApp hoje/nesta
// hora — a mesma régua de limite que `scripts/whatsapp-bot.mjs` já respeita
// antes de mandar (lib/limite-envio.js), só que aqui é só leitura, pra tela.
export async function carregarRegua(supabase) {
  try {
    const { data: config, error: erroConfig } = await supabase.from('configuracoes').select('*').eq('id', 1).single();
    if (erroConfig) throw erroConfig;

    const { data: mensagensBrutas, error: erroMensagens } = await supabase
      .from('mensagens')
      .select('id, cliente_id, tipo, texto, status, enviado_em, criado_em, clientes(nome)')
      .order('criado_em', { ascending: false })
      .limit(200);
    if (erroMensagens) throw erroMensagens;

    const { riscoDe, erro: erroRisco } = await carregarRiscos(supabase);
    if (erroRisco) throw new Error(erroRisco);

    const mensagens = mensagensBrutas.map((m) => ({
      ...m,
      clienteNome: m.clientes?.nome || 'Cliente removido',
      risco: riscoDe(m.cliente_id),
    }));

    const hoje = hojeBrasil();
    const horaAtual = horaBrasil(new Date());
    const enviadasHoje = mensagens.filter((m) => m.status === 'enviada' && dataBrasil(m.enviado_em) === hoje);
    const nestaHora = enviadasHoje.filter((m) => horaBrasil(m.enviado_em) === horaAtual).length;

    return { config, mensagens, enviadasHoje: enviadasHoje.length, nestaHora, erro: null };
  } catch (e) {
    return { config: null, mensagens: [], enviadasHoje: 0, nestaHora: 0, erro: e.message || 'erro desconhecido' };
  }
}
