// Fase 6: régua de cobrança por WhatsApp — decide QUEM recebe mensagem HOJE.
// Função pura: só decide, não manda nada (quem manda é a rota do cron, com o
// resultado daqui) e não grava no banco.
//
// Três tipos, cada um com sua regra de "não repetir":
//   antes_vencimento — título ainda em aberto, a `diasAntesAviso` dias do
//     vencimento OU MENOS (não só no dia exato: se o bot ficou fora do ar
//     bem naquele dia, ainda alcança nos dias seguintes, até vencer). Uma
//     vez por título.
//   vencimento — título vence hoje. Uma vez por título. Não precisa de
//     "catch-up": se passar do dia sem mandar, o título vira 'atrasado' e
//     entra na cobrança de atraso — não fica esquecido.
//   atraso — cliente com título atrasado. Mesma regra da fila de cobrança da
//     tela "Hoje" (lib/hoje.js), incluindo o "Já cobrei": por CLIENTE, não por
//     título, e só de novo depois de `diasRepetirCobranca` dias da última vez.
//
// `mensagensEnviadas` deve trazer mensagens com status 'enviada' OU
// 'pendente' (quem chama filtra) — 'pendente' conta como "já enfileirado",
// pra não duplicar quando o bot enfileira antes de mandar (scripts/whatsapp-bot.mjs).
// Uma tentativa que deu 'erro' NÃO conta como avisado e entra de novo na
// próxima rodada.

import { dataBrasil, diasEntre } from './util.js';

export function montarRegua({ titulos, clientes, mensagensEnviadas, hoje, diasAntesAviso, diasRepetirCobranca }) {
  const clientePorId = new Map(clientes.map((c) => [c.id, c]));

  const jaAvisadoTitulo = new Set(); // `${tipo}:${titulo_id}`
  const ultimaCobrancaPorCliente = new Map(); // cliente_id -> 'YYYY-MM-DD' mais recente (só enviada de verdade)
  const atrasoJaEnfileirado = new Set(); // cliente_id com 'atraso' pendente, ainda não mandado

  for (const m of mensagensEnviadas) {
    if (m.tipo === 'antes_vencimento' || m.tipo === 'vencimento') {
      // Pendente ou enviada, tanto faz: título já tem mensagem na fila, não
      // duplica — mesmo antes de ela ter saído de verdade.
      jaAvisadoTitulo.add(`${m.tipo}:${m.titulo_id}`);
    } else if (m.tipo === 'atraso') {
      if (!m.enviado_em) {
        atrasoJaEnfileirado.add(m.cliente_id);
        continue;
      }
      // Mesma conversão de fuso que lib/hoje.js usa pro mesmo campo — sem
      // isso, um envio entre 21h e meia-noite (Brasília) cairia no dia
      // seguinte aqui e desalinharia a contagem de dias_repetir_cobranca.
      const data = dataBrasil(m.enviado_em);
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
      if (
        diasParaVencer > 0 &&
        diasParaVencer <= diasAntesAviso &&
        !jaAvisadoTitulo.has(`antes_vencimento:${titulo.id}`)
      ) {
        envios.push({ tipo: 'antes_vencimento', cliente, titulo, dias: diasParaVencer });
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
    if (atrasoJaEnfileirado.has(clienteId)) continue; // já tem cobrança na fila, esperando ser mandada
    const ultima = ultimaCobrancaPorCliente.get(clienteId);
    if (!ultima || diasEntre(ultima, hoje) >= diasRepetirCobranca) {
      envios.push({ tipo: 'atraso', ...situacao });
    }
  }

  return envios;
}
