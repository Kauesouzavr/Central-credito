// Previsão de caixa (Fase 5). Função pura: recebe o que foi lido do banco e
// devolve a projeção de recebimento de hoje até 4 semanas à frente.
//
// - Soma dos vencimentos: saldo em aberto dos títulos, por período.
// - Previsão ajustada: saldo de cada cliente × probabilidade de pagamento,
//   onde probabilidade = max(0,15; 1 − nota de risco ÷ 130).
// - Diferença: soma dos vencimentos − previsão ajustada.
//
// Períodos: "Já vencidos" (títulos atrasados, que ainda podem ser recebidos),
// semana 1 (hoje a hoje+6), semana 2, semana 3 e semana 4 (hoje+21 a hoje+27).
// O que vence depois disso fica de fora da conta e é devolvido à parte
// (`depois`). Tudo é somado em centavos, e cada valor previsto é arredondado
// uma vez só, por cliente e período, pra tabela e o gráfico fecharem no centavo.

import { diasEntre, paraCentavos, somarDias } from './util.js';

export const SEMANAS = 4;
export const PISO_PROBABILIDADE = 0.15;
export const DIVISOR_RISCO = 130;

// Chance de o cliente pagar, de 0 a 1, a partir da nota de risco (0 a 100).
export function probabilidadePagamento(nota) {
  return Math.max(PISO_PROBABILIDADE, 1 - Number(nota) / DIVISOR_RISCO);
}

const VENCIDOS = 0;
const DEPOIS = SEMANAS + 1;

// 0 = já vencido, 1 a 4 = semana em que vence, 5 = depois das 4 semanas.
function indiceDoPeriodo(titulo, hoje) {
  const dias = diasEntre(hoje, titulo.data_vencimento);
  if (titulo.status === 'atrasado' || dias < 0) return VENCIDOS;
  const semana = Math.floor(dias / 7) + 1;
  return semana <= SEMANAS ? semana : DEPOIS;
}

function reais(centavos) {
  return centavos / 100;
}

function soma(lista) {
  return lista.reduce((total, valor) => total + valor, 0);
}

// titulos: linhas de `titulos_com_saldo` (cliente_id, status, data_vencimento,
//   valor_restante).
// clientes: [{ id, nome }].
// riscoDe(clienteId): o risco calculado (nota, nivel, motivos) de cada cliente.
// hoje: 'YYYY-MM-DD' no fuso de Brasília.
export function montarPrevisao({ titulos, clientes, riscoDe, hoje }) {
  const clientePorId = new Map(clientes.map((c) => [c.id, c]));

  // Saldo em aberto de cada cliente, em centavos, em cada um dos 6 períodos.
  const saldoDosClientes = new Map();
  for (const titulo of titulos) {
    if (titulo.status === 'pago' || !clientePorId.has(titulo.cliente_id)) continue;
    const saldos = saldoDosClientes.get(titulo.cliente_id) || Array(DEPOIS + 1).fill(0);
    saldos[indiceDoPeriodo(titulo, hoje)] += paraCentavos(titulo.valor_restante);
    saldoDosClientes.set(titulo.cliente_id, saldos);
  }

  const saldoPorPeriodo = Array(DEPOIS + 1).fill(0);
  const previstoPorPeriodo = Array(DEPOIS + 1).fill(0);
  const linhasDosClientes = [];

  for (const [clienteId, saldos] of saldoDosClientes) {
    const risco = riscoDe(clienteId);
    const probabilidade = probabilidadePagamento(risco.nota);
    const previstos = saldos.map((saldo) => Math.round(saldo * probabilidade));

    saldos.forEach((saldo, i) => {
      saldoPorPeriodo[i] += saldo;
      previstoPorPeriodo[i] += previstos[i];
    });

    // Só entra na tabela por cliente quem tem algo dentro da janela de 4 semanas.
    const saldoNaJanela = soma(saldos.slice(VENCIDOS, DEPOIS));
    if (saldoNaJanela > 0) {
      const previstoNaJanela = soma(previstos.slice(VENCIDOS, DEPOIS));
      linhasDosClientes.push({
        cliente: clientePorId.get(clienteId),
        risco,
        probabilidade,
        saldo: reais(saldoNaJanela),
        previsto: reais(previstoNaJanela),
        diferenca: reais(saldoNaJanela - previstoNaJanela),
      });
    }
  }

  linhasDosClientes.sort(
    (a, b) => b.diferenca - a.diferenca || a.cliente.nome.localeCompare(b.cliente.nome, 'pt-BR')
  );

  const periodos = [];
  for (let i = VENCIDOS; i < DEPOIS; i++) {
    const semana = i;
    periodos.push({
      chave: i === VENCIDOS ? 'vencidos' : `semana-${semana}`,
      rotulo: i === VENCIDOS ? 'Já vencidos' : `Semana ${semana}`,
      de: i === VENCIDOS ? null : somarDias(hoje, 7 * (semana - 1)),
      ate: i === VENCIDOS ? null : somarDias(hoje, 7 * semana - 1),
      saldo: reais(saldoPorPeriodo[i]),
      previsto: reais(previstoPorPeriodo[i]),
      diferenca: reais(saldoPorPeriodo[i] - previstoPorPeriodo[i]),
    });
  }

  const saldoTotal = soma(saldoPorPeriodo.slice(VENCIDOS, DEPOIS));
  const previstoTotal = soma(previstoPorPeriodo.slice(VENCIDOS, DEPOIS));

  return {
    janela: { de: hoje, ate: somarDias(hoje, 7 * SEMANAS - 1) },
    periodos,
    total: {
      saldo: reais(saldoTotal),
      previsto: reais(previstoTotal),
      diferenca: reais(saldoTotal - previstoTotal),
    },
    depois: {
      saldo: reais(saldoPorPeriodo[DEPOIS]),
      previsto: reais(previstoPorPeriodo[DEPOIS]),
    },
    clientes: linhasDosClientes,
  };
}
