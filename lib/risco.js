// Motor de risco (Fase 3). Função pura: recebe os títulos de UM cliente e os
// parâmetros da tabela `configuracoes` e devolve a nota de risco (0 a 100),
// o nível (baixo / médio / alto) e os motivos em português.
//
// nota = atraso atual (até 60) + perfil do cliente (até 20) + mudança de padrão
//
// - Atraso atual: o título em aberto mais atrasado. Cada dia vale
//   60 ÷ limite_atraso pontos, até o máximo de 60.
// - Perfil: cliente NOVO (nenhum título quitado ainda) começa com 10 pontos;
//   cliente antigo ganha até 20, conforme a proporção dos títulos já quitados
//   que foram pagos com atraso (sempre em dia = 0).
// - Mudança de padrão: soma peso_mudanca_padrao se o cliente já quitou 3 ou
//   mais títulos, todos em dia, e agora tem um título atrasado.
//
// Nível: >= corte_risco_alto é "alto", >= corte_risco_medio é "medio".

export const PONTOS_ATRASO_MAX = 60;
export const PONTOS_PERFIL_MAX = 20;
export const PONTOS_CLIENTE_NOVO = 10;
export const MIN_QUITADOS_PARA_PADRAO = 3;

function arredondar(valor) {
  return Math.round(valor * 100) / 100;
}

function plural(quantidade, singular, pluralTexto) {
  return quantidade === 1 ? singular : pluralTexto;
}

// titulos: linhas de `titulos_com_saldo` de um cliente (id, status,
//   dias_atraso, data_vencimento).
// ultimoPagamento: { [titulo_id]: 'YYYY-MM-DD' } com a data do último
//   pagamento de cada título quitado. Título quitado é "pago com atraso" se
//   esse pagamento veio depois do vencimento.
export function calcularRisco(titulos, ultimoPagamento, config) {
  const maximos = {
    atraso: PONTOS_ATRASO_MAX,
    perfil: PONTOS_PERFIL_MAX,
    mudanca: Number(config.peso_mudanca_padrao),
  };

  if (titulos.length === 0) {
    return {
      nota: 0,
      nivel: 'baixo',
      motivos: ['Ainda sem compras'],
      partes: { atraso: 0, perfil: 0, mudanca: 0 },
      maximos,
    };
  }

  const abertos = titulos.filter((t) => t.status !== 'pago');
  const quitados = titulos.filter((t) => t.status === 'pago');

  const atrasados = abertos.filter((t) => Number(t.dias_atraso) > 0);
  const maiorAtraso = atrasados.reduce((maior, t) => Math.max(maior, Number(t.dias_atraso)), 0);

  const quitadosComAtraso = quitados.filter((t) => {
    const pagoEm = ultimoPagamento[t.id];
    return Boolean(pagoEm) && pagoEm > t.data_vencimento;
  }).length;

  const limite = Number(config.limite_atraso);
  const proporcaoAtraso = maiorAtraso === 0 ? 0 : limite > 0 ? Math.min(maiorAtraso / limite, 1) : 1;
  const pontosAtraso = PONTOS_ATRASO_MAX * proporcaoAtraso;

  const clienteNovo = quitados.length === 0;
  const pontosPerfil = clienteNovo
    ? PONTOS_CLIENTE_NOVO
    : PONTOS_PERFIL_MAX * (quitadosComAtraso / quitados.length);

  const mudouPadrao =
    maiorAtraso >= 1 && quitados.length >= MIN_QUITADOS_PARA_PADRAO && quitadosComAtraso === 0;
  const pontosMudanca = mudouPadrao ? maximos.mudanca : 0;

  const nota = arredondar(Math.min(100, pontosAtraso + pontosPerfil + pontosMudanca));

  let nivel = 'baixo';
  if (nota >= Number(config.corte_risco_alto)) nivel = 'alto';
  else if (nota >= Number(config.corte_risco_medio)) nivel = 'medio';

  const motivos = [];
  if (maiorAtraso > 0) {
    const varios = atrasados.length > 1 ? ` (${atrasados.length} títulos atrasados)` : '';
    motivos.push(`Atrasado há ${maiorAtraso} ${plural(maiorAtraso, 'dia', 'dias')}${varios}`);
  }
  if (mudouPadrao) {
    motivos.push('Sempre pagou em dia e agora atrasou');
  }
  if (clienteNovo) {
    motivos.push('Cliente novo, ainda sem histórico de pagamento');
  } else if (quitadosComAtraso > 0) {
    motivos.push(
      `Já pagou ${quitadosComAtraso} de ${quitados.length} ${plural(quitados.length, 'título', 'títulos')} com atraso`
    );
  } else if (!mudouPadrao) {
    motivos.push(maiorAtraso === 0 ? 'Sempre pagou em dia' : 'Até agora sempre pagou em dia');
  }

  return {
    nota,
    nivel,
    motivos,
    partes: {
      atraso: arredondar(pontosAtraso),
      perfil: arredondar(pontosPerfil),
      mudanca: pontosMudanca,
    },
    maximos,
  };
}
