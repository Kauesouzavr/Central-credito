import { buscarTudo, carregarRiscos } from './carregar-risco.js';
import { montarRegua } from './regua.js';
import { hojeBrasil, primeiroNome } from './util.js';

// Pra tela "Hoje": quantas mensagens a régua (lib/regua.js) mandaria hoje se
// o bot rodasse agora, e os primeiros nomes (por risco) pra prévia do card
// de destaque. Reaproveita `carregarRiscos` (mesma consulta de títulos que a
// lista de clientes e o motor de risco já usam) em vez de ler de novo.
export async function carregarEnvioAutomatico(supabase) {
  try {
    const { riscoDe, titulos, config, erro: erroRisco } = await carregarRiscos(supabase);
    if (erroRisco) throw new Error(erroRisco);

    const [clientes, mensagensExistentes] = await Promise.all([
      buscarTudo(() => supabase.from('clientes').select('id, nome, telefone')),
      // Mesmos três status que scripts/whatsapp-bot.mjs usa pra régua não
      // duplicar o que já está enfileirado ou esperando aprovação.
      buscarTudo(() =>
        supabase.from('mensagens').select('id, cliente_id, titulo_id, tipo, enviado_em').in('status', ['enviada', 'pendente', 'pendente_revisao'])
      ),
    ]);

    const envios = montarRegua({
      titulos,
      clientes,
      mensagensEnviadas: mensagensExistentes,
      hoje: hojeBrasil(),
      diasAntesAviso: Number(config.dias_antes_aviso),
      diasRepetirCobranca: Number(config.dias_repetir_cobranca),
    });

    const clientesUnicos = new Map();
    for (const envio of envios) {
      if (!clientesUnicos.has(envio.cliente.id)) clientesUnicos.set(envio.cliente.id, envio.cliente);
    }
    const nomes = [...clientesUnicos.values()]
      .sort((a, b) => (riscoDe(b.id)?.nota || 0) - (riscoDe(a.id)?.nota || 0))
      .slice(0, 3)
      .map((c) => primeiroNome(c.nome));

    return {
      total: envios.length,
      clientesEnvolvidos: clientesUnicos.size,
      nomes,
      ativo: config.whatsapp_envio_automatico !== false && !config.whatsapp_pausado,
      erro: null,
    };
  } catch (e) {
    return { total: 0, clientesEnvolvidos: 0, nomes: [], ativo: false, erro: e.message || 'erro desconhecido' };
  }
}
