// Fase 6: régua de cobrança por WhatsApp — decide QUEM recebe mensagem HOJE.
// Função pura: só decide, não manda nada (quem manda é a rota do cron, com o
// resultado daqui) e não grava no banco.
//
// Três tipos, cada um com sua regra de "não repetir":
//   antes_vencimento — título ainda em aberto, faltam exatamente
//     `diasAntesAviso` dias pro vencimento. Uma vez por título.
//   vencimento — título vence hoje. Uma vez por título.
//   atraso — cliente com título atrasado. Mesma regra da fila de cobrança da
//     tela "Hoje" (lib/hoje.js), incluindo o "Já cobrei": por CLIENTE, não por
//     título, e só de novo depois de `diasRepetirCobranca` dias da última vez.
//
// `mensagensEnviadas` deve trazer só mensagens com status 'enviada' (quem
// chama filtra, do jeito que lib/carregar-hoje.js já faz pra montarHoje) —
// uma tentativa que deu erro não conta como "já avisado" e entra de novo na
// próxima rodada.

import { diasEntre } from './util.js';

export function montarRegua({ titulos, clientes, mensagensEnviadas, hoje, diasAntesAviso, diasRepetirCobranca }) {
  const clientePorId = new Map(clientes.map((c) => [c.id, c]));

  const jaAvisadoTitulo = new Set(); // `${tipo}:${titulo_id}`
  const ultimaCobrancaPorCliente = new Map(); // cliente_id -> 'YYYY-MM-DD' mais recente

  for (const m of mensagensEnviadas) {
    if (!m.enviado_em) continue;
    if (m.tipo === 'antes_vencimento' || m.tipo === 'vencimento') {
      jaAvisadoTitulo.add(`${m.tipo}:${m.titulo_id}`);
    } else if (m.tipo === 'atraso') {
      const data = String(m.enviado_em).slice(0, 10);
      const atual = ultimaCobrancaPorCliente.get(m.cliente_id);
      if (!atual || data > atual) ultimaCobrancaPorCliente.set(m.cliente_id, data);
    }
  }

  const envios = [];
  const atrasadosPorCliente = new Map(); // cliente_id -> { cliente, titulos, totalRestante, maiorAtraso }

  for (const titulo of titulos) {
    const cliente = clientePorId.get(titulo.cliente_id);
    if (!cliente) continue;

    if (titulo.status === 'em_aberto') {
      const diasParaVencer = diasEntre(hoje, titulo.data_vencimento);
      if (diasParaVencer === diasAntesAviso && !jaAvisadoTitulo.has(`antes_vencimento:${titulo.id}`)) {
        envios.push({ tipo: 'antes_vencimento', cliente, titulo, dias: diasAntesAviso });
      } else if (diasParaVencer === 0 && !jaAvisadoTitulo.has(`vencimento:${titulo.id}`)) {
        envios.push({ tipo: 'vencimento', cliente, titulo });
      }
    } else if (titulo.status === 'atrasado') {
      let situacao = atrasadosPorCliente.get(titulo.cliente_id);
      if (!situacao) {
        situacao = { cliente, titulos: [], totalRestante: 0, maiorAtraso: 0 };
        atrasadosPorCliente.set(titulo.cliente_id, situacao);
      }
      situacao.titulos.push(titulo);
      situacao.totalRestante = Math.round((situacao.totalRestante + Number(titulo.valor_restante)) * 100) / 100;
      situacao.maiorAtraso = Math.max(situacao.maiorAtraso, Number(titulo.dias_atraso));
    }
  }

  for (const [clienteId, situacao] of atrasadosPorCliente) {
    const ultima = ultimaCobrancaPorCliente.get(clienteId);
    if (!ultima || diasEntre(ultima, hoje) >= diasRepetirCobranca) {
      envios.push({ tipo: 'atraso', ...situacao });
    }
  }

  return envios;
}
