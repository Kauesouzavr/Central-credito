// Fase 7: relatório semanal — resumo dos últimos 7 dias (hoje e os 6 antes),
// comparado com os 7 dias anteriores a esses. Função pura: recebe o que foi
// lido do banco e devolve os números já calculados, prontos pra tela.
//
// - Vendido: soma do valor dos títulos criados na semana (data_venda).
// - Recebido: soma dos pagamentos feitos na semana (data_pagamento) — não é
//   o mesmo que "vendido": um pagamento pode ser de um título de outra semana.
// - Clientes novos: cadastrados na semana (criado_em).
// - Novos atrasos: títulos que venceram dentro da semana E continuam em
//   aberto hoje (não é um histórico de "ficou atrasado e depois foi pago
//   ainda na mesma semana" — o status usado é sempre o de agora).
// - Mensagens de WhatsApp: quantas foram mandadas de verdade (status
//   'enviada') na semana, por tipo.
//
// Cada número da semana atual vem acompanhado da variação (%) em relação à
// semana anterior — null quando não há base de comparação (semana anterior
// zerada e a atual não).

import { paraCentavos, somarDias } from './util.js';

const DIAS_SEMANA = 7;

// semanasAtras=0 -> semana atual (hoje-6 .. hoje); 1 -> a anterior (hoje-13 .. hoje-7).
function periodo(hoje, semanasAtras) {
  const fim = somarDias(hoje, -semanasAtras * DIAS_SEMANA);
  const inicio = somarDias(fim, -(DIAS_SEMANA - 1));
  return { inicio, fim };
}

function dentroDoPeriodo(data, p) {
  return Boolean(data) && data >= p.inicio && data <= p.fim;
}

function reais(centavos) {
  return centavos / 100;
}

const TIPOS_MENSAGEM = ['cadastro', 'antes_vencimento', 'vencimento', 'atraso'];

function resumoDoPeriodo({ titulos, pagamentos, clientes, mensagens, periodo: p }) {
  let vendidoCentavos = 0;
  let titulosVendidos = 0;
  let novosAtrasos = 0;
  for (const t of titulos) {
    if (dentroDoPeriodo(t.data_venda, p)) {
      vendidoCentavos += paraCentavos(t.valor);
      titulosVendidos += 1;
    }
    if (t.status === 'atrasado' && dentroDoPeriodo(t.data_vencimento, p)) {
      novosAtrasos += 1;
    }
  }

  let recebidoCentavos = 0;
  let pagamentosCount = 0;
  for (const pg of pagamentos) {
    if (dentroDoPeriodo(pg.data_pagamento, p)) {
      recebidoCentavos += paraCentavos(pg.valor);
      pagamentosCount += 1;
    }
  }

  let clientesNovos = 0;
  for (const c of clientes) {
    if (dentroDoPeriodo(c.data_cadastro, p)) clientesNovos += 1;
  }

  const mensagensPorTipo = Object.fromEntries(TIPOS_MENSAGEM.map((t) => [t, 0]));
  for (const m of mensagens) {
    if (m.status === 'enviada' && dentroDoPeriodo(m.data_envio, p) && m.tipo in mensagensPorTipo) {
      mensagensPorTipo[m.tipo] += 1;
    }
  }
  const mensagensEnviadas = Object.values(mensagensPorTipo).reduce((total, n) => total + n, 0);

  return {
    periodo: p,
    vendido: reais(vendidoCentavos),
    titulosVendidos,
    recebido: reais(recebidoCentavos),
    pagamentosCount,
    clientesNovos,
    novosAtrasos,
    mensagensEnviadas,
    mensagensPorTipo,
  };
}

// null = sem base de comparação (semana anterior zerada).
function variacaoPercentual(atual, anterior) {
  if (anterior === 0) return atual === 0 ? 0 : null;
  return Math.round(((atual - anterior) / anterior) * 1000) / 10;
}

// titulos: linhas de `titulos_com_saldo` (valor, data_venda, data_vencimento, status).
// pagamentos: [{ valor, data_pagamento }].
// clientes: [{ data_cadastro }] — 'YYYY-MM-DD' já convertido pro fuso de Brasília.
// mensagens: [{ tipo, status, data_envio }] — data_envio já convertida (ou null, se não enviada).
// hoje: 'YYYY-MM-DD' no fuso de Brasília.
export function montarRelatorio({ titulos, pagamentos, clientes, mensagens, hoje }) {
  const semanaAtual = periodo(hoje, 0);
  const semanaAnterior = periodo(hoje, 1);

  const atual = resumoDoPeriodo({ titulos, pagamentos, clientes, mensagens, periodo: semanaAtual });
  const anterior = resumoDoPeriodo({ titulos, pagamentos, clientes, mensagens, periodo: semanaAnterior });

  return {
    semanaAtual,
    semanaAnterior,
    atual,
    anterior,
    variacao: {
      vendido: variacaoPercentual(atual.vendido, anterior.vendido),
      recebido: variacaoPercentual(atual.recebido, anterior.recebido),
      clientesNovos: variacaoPercentual(atual.clientesNovos, anterior.clientesNovos),
      novosAtrasos: variacaoPercentual(atual.novosAtrasos, anterior.novosAtrasos),
      mensagensEnviadas: variacaoPercentual(atual.mensagensEnviadas, anterior.mensagensEnviadas),
    },
  };
}
