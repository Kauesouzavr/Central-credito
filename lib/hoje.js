// Tela "Hoje" (Fase 4). Função pura: recebe o que foi lido do banco e devolve
// tudo que a tela mostra, já contado e ordenado.
//
// - Total vencido: saldo de todos os títulos atrasados.
// - Precisam de atenção hoje: clientes com título atrasado ou que vence hoje.
// - Nunca cobrados: clientes atrasados sem nenhuma cobrança registrada.
// - Atraso mais antigo: maior `dias_atraso` entre os títulos atrasados.
// - A vencer em 30 dias: saldo dos títulos ainda no prazo que vencem de hoje
//   até daqui a 30 dias (inclusive).
// - Fila de cobrança: clientes atrasados, do maior risco pro menor. Quem foi
//   cobrado há menos de `dias_repetir_cobranca` dias sai da fila e vai pra
//   "cobrados recentemente"; passado esse prazo, volta pra fila.
//
// "Cobrança" é uma linha em `mensagens` com tipo 'atraso' e status 'enviada':
// hoje vem do botão "Já cobrei"; na Fase 6, também das mensagens de WhatsApp.

import { dataBrasil, diasEntre, paraCentavos, somarDias } from './util.js';

// Texto gravado em `mensagens` pelo botão "Já cobrei". É o que distingue uma
// cobrança manual (que dá pra desfazer) de uma mensagem enviada pelo sistema.
export const MARCA_COBRANCA_MANUAL = 'Cobrança registrada manualmente';
export const DIAS_A_VENCER = 30;

function reais(centavos) {
  return centavos / 100;
}

function porNome(a, b) {
  return a.cliente.nome.localeCompare(b.cliente.nome, 'pt-BR');
}

// titulos: linhas de `titulos_com_saldo` (cliente_id, status, dias_atraso,
//   data_vencimento, valor_restante).
// clientes: [{ id, nome, telefone }].
// cobrancas: linhas de `mensagens` (id, cliente_id, enviado_em, texto) com
//   tipo 'atraso' e status 'enviada'.
// riscoDe(clienteId): o risco calculado (nota, nivel, motivos) de cada cliente.
// hoje: 'YYYY-MM-DD' no fuso de Brasília.
export function montarHoje({ titulos, clientes, cobrancas, riscoDe, diasRepetirCobranca, hoje }) {
  const clientePorId = new Map(clientes.map((c) => [c.id, c]));
  const limiteAVencer = somarDias(hoje, DIAS_A_VENCER);

  // Um resumo por cliente que tem título em aberto.
  const situacoes = new Map();
  let totalVencidoCentavos = 0;
  let aVencerCentavos = 0;

  for (const titulo of titulos) {
    if (titulo.status === 'pago' || !clientePorId.has(titulo.cliente_id)) continue;

    let situacao = situacoes.get(titulo.cliente_id);
    if (!situacao) {
      situacao = {
        abertoCentavos: 0,
        atrasadoCentavos: 0,
        atrasados: 0,
        maiorAtraso: 0,
        venceHojeCentavos: 0,
        venceHoje: 0,
      };
      situacoes.set(titulo.cliente_id, situacao);
    }

    const centavos = paraCentavos(titulo.valor_restante);
    situacao.abertoCentavos += centavos;

    if (titulo.status === 'atrasado') {
      totalVencidoCentavos += centavos;
      situacao.atrasadoCentavos += centavos;
      situacao.atrasados += 1;
      situacao.maiorAtraso = Math.max(situacao.maiorAtraso, Number(titulo.dias_atraso));
    } else {
      if (titulo.data_vencimento === hoje) {
        situacao.venceHojeCentavos += centavos;
        situacao.venceHoje += 1;
      }
      if (titulo.data_vencimento >= hoje && titulo.data_vencimento <= limiteAVencer) {
        aVencerCentavos += centavos;
      }
    }
  }

  // A cobrança mais recente de cada cliente.
  const ultimaCobranca = new Map();
  for (const cobranca of cobrancas) {
    if (!cobranca.enviado_em) continue;
    const instante = new Date(cobranca.enviado_em).getTime();
    const atual = ultimaCobranca.get(cobranca.cliente_id);
    if (!atual || instante > atual.instante) {
      ultimaCobranca.set(cobranca.cliente_id, {
        id: cobranca.id,
        instante,
        data: dataBrasil(cobranca.enviado_em),
        manual: cobranca.texto === MARCA_COBRANCA_MANUAL,
      });
    }
  }

  const fila = [];
  const cobradosRecentemente = [];
  const vencemHoje = [];
  const candidatosARisco = [];
  const atencao = new Set();
  let nuncaCobrados = 0;
  let atrasoMaisAntigo = 0;

  for (const [clienteId, situacao] of situacoes) {
    const cliente = clientePorId.get(clienteId);
    const risco = riscoDe(clienteId);

    candidatosARisco.push({
      cliente,
      risco,
      maiorAtraso: situacao.maiorAtraso,
      emAberto: reais(situacao.abertoCentavos),
    });

    if (situacao.atrasados > 0) {
      atencao.add(clienteId);
      atrasoMaisAntigo = Math.max(atrasoMaisAntigo, situacao.maiorAtraso);

      const ultima = ultimaCobranca.get(clienteId);
      if (!ultima) nuncaCobrados += 1;

      const linha = {
        cliente,
        risco,
        totalAtrasado: reais(situacao.atrasadoCentavos),
        titulosAtrasados: situacao.atrasados,
        maiorAtraso: situacao.maiorAtraso,
      };

      if (ultima && diasEntre(ultima.data, hoje) < diasRepetirCobranca) {
        cobradosRecentemente.push({
          ...linha,
          cobranca: { id: ultima.id, data: ultima.data, podeDesfazer: ultima.manual },
        });
      } else {
        fila.push({ ...linha, ultimaCobranca: ultima ? ultima.data : null });
      }
    }

    if (situacao.venceHoje > 0) {
      atencao.add(clienteId);
      vencemHoje.push({
        cliente,
        risco,
        total: reais(situacao.venceHojeCentavos),
        titulos: situacao.venceHoje,
      });
    }
  }

  fila.sort(
    (a, b) =>
      b.risco.nota - a.risco.nota ||
      b.maiorAtraso - a.maiorAtraso ||
      b.totalAtrasado - a.totalAtrasado ||
      porNome(a, b)
  );
  cobradosRecentemente.sort(
    (a, b) => (a.cobranca.data < b.cobranca.data ? 1 : a.cobranca.data > b.cobranca.data ? -1 : 0) || porNome(a, b)
  );
  vencemHoje.sort((a, b) => b.risco.nota - a.risco.nota || b.total - a.total || porNome(a, b));

  // Destaque: o cliente de maior risco entre os que têm algo em aberto. Só
  // vale destacar quem está em risco médio ou alto.
  candidatosARisco.sort(
    (a, b) =>
      b.risco.nota - a.risco.nota ||
      b.maiorAtraso - a.maiorAtraso ||
      b.emAberto - a.emAberto ||
      porNome(a, b)
  );
  const maisArriscado = candidatosARisco[0] || null;
  const maiorRisco = maisArriscado && maisArriscado.risco.nivel !== 'baixo' ? maisArriscado : null;

  return {
    totalVencido: reais(totalVencidoCentavos),
    clientesAtencao: atencao.size,
    nuncaCobrados,
    atrasoMaisAntigo,
    aVencer30Dias: reais(aVencerCentavos),
    maiorRisco,
    fila,
    cobradosRecentemente,
    vencemHoje,
    diasRepetirCobranca,
  };
}
