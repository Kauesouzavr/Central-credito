// Fase 7 (visual): texto narrativo do relatório semanal, pronto pra copiar
// e colar no WhatsApp ou e-mail. Combina o que `lib/relatorio.js` (semana
// atual x anterior), `lib/hoje.js` (vencido em aberto agora) e
// `lib/previsao.js` (previsão ajustada) já calculam — não recalcula nada
// sozinho, só narra em português.

import { formatarMoeda, plural } from './util.js';

// "16/09 a 22/09" (sem o ano, que é sempre o atual).
function intervaloCurto(periodo) {
  const { inicio, fim } = periodo;
  const curta = (data) => `${data.slice(8, 10)}/${data.slice(5, 7)}`;
  return `${curta(inicio)} a ${curta(fim)}`;
}

// null = sem base de comparação; 0 = igual; positivo/negativo = subiu/desceu.
export function variacaoTexto(v) {
  if (v === null) return 'sem comparação com a semana anterior';
  if (v === 0) return 'igual à semana passada';
  const seta = v > 0 ? '▲' : '▼';
  return `${seta} ${Math.abs(v)}% que a semana passada`;
}

// relatorio: resumo de `montarRelatorio` (lib/relatorio.js).
// totalVencido: resumo.totalVencido de `montarHoje` (lib/hoje.js).
// esperado: resumo.total.previsto de `montarPrevisao` (lib/previsao.js).
// clientesAtrasados: quantos clientes têm hoje algum título atrasado.
// nomesRiscoAlto: nomes dos clientes em risco alto agora, com algo em aberto.
export function gerarRelatorioTexto({ relatorio, totalVencido, esperado, clientesAtrasados, nomesRiscoAlto }) {
  const { atual, variacao, semanaAtual } = relatorio;
  const decisoes = atual.pagamentosCount + atual.titulosVendidos;

  const paragrafos = [
    `Semana de ${intervaloCurto(semanaAtual)}: entrou ${formatarMoeda(atual.recebido)} em pagamentos e foram vendidos ${formatarMoeda(atual.vendido)} em ${atual.titulosVendidos} ${plural(atual.titulosVendidos, 'título novo', 'títulos novos')}.`,
    `Foram ${atual.pagamentosCount} ${plural(atual.pagamentosCount, 'pagamento', 'pagamentos')} registrados, ${variacaoTexto(variacao.recebido)}.`,
    `Hoje há ${formatarMoeda(totalVencido)} vencido em aberto, com ${clientesAtrasados} ${plural(clientesAtrasados, 'cliente atrasado', 'clientes atrasados')}${
      atual.novosAtrasos > 0 ? ` (${atual.novosAtrasos} ${plural(atual.novosAtrasos, 'título atrasou', 'títulos atrasaram')} nesta semana)` : ''
    }.`,
    `A previsão é que entrem ${formatarMoeda(esperado)} nas próximas 4 semanas, já descontando o risco de cada cliente.`,
    `Foram ${decisoes} ${plural(decisoes, 'decisão tomada', 'decisões tomadas')} nesta semana (pagamentos e compras lançados).`,
    nomesRiscoAlto.length > 0
      ? `${nomesRiscoAlto.length} ${plural(nomesRiscoAlto.length, 'cliente está', 'clientes estão')} em risco alto agora: ${nomesRiscoAlto.join(', ')}.`
      : 'Nenhum cliente em risco alto no momento.',
  ];

  return {
    periodo: intervaloCurto(semanaAtual),
    paragrafos,
    texto: `Central de Crédito — Relatório semanal\n\n${paragrafos.join('\n\n')}`,
    numeros: {
      entrou: atual.recebido,
      qtdPagamentos: atual.pagamentosCount,
      vencido: totalVencido,
      clientesAtrasados,
      esperado,
      decisoes,
    },
  };
}
