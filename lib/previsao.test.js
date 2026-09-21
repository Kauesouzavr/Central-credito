import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarPrevisao, probabilidadePagamento } from './previsao.js';
import { paraCentavos } from './util.js';

const HOJE = '2026-09-21';

const CLIENTES = [
  { id: 'A', nome: 'Ana' },
  { id: 'B', nome: 'Bruno' },
  { id: 'C', nome: 'Carla' },
  { id: 'D', nome: 'Davi' },
];

// Nota de risco de cada cliente: 65 -> chance 50%; 26 -> 80%; 0 -> 100%.
const NOTAS = { A: 65, B: 26, C: 0, D: 0 };

function titulo(clienteId, valorRestante, vence, status = 'em_aberto') {
  return {
    id: `${clienteId}-${vence}-${valorRestante}`,
    cliente_id: clienteId,
    status,
    valor_restante: valorRestante,
    data_vencimento: vence,
  };
}

function previsao(titulos, notas = NOTAS) {
  return montarPrevisao({
    titulos,
    clientes: CLIENTES,
    riscoDe: (id) => ({ nota: notas[id] ?? 0, nivel: 'baixo', motivos: [] }),
    hoje: HOJE,
  });
}

const TITULOS = [
  titulo('A', '100.00', '2026-09-01', 'atrasado'), // já vencido
  titulo('A', '50.00', '2026-09-21'), // hoje: semana 1
  titulo('B', '200.00', '2026-09-27'), // hoje + 6: semana 1
  titulo('B', '300.00', '2026-09-28'), // hoje + 7: semana 2
  titulo('C', '400.00', '2026-10-18'), // hoje + 27: semana 4
  titulo('C', '500.00', '2026-10-19'), // hoje + 28: depois das 4 semanas
  titulo('D', '0.00', '2026-08-01', 'pago'), // quitado: ignorado
];

test('a probabilidade cai com o risco e nunca passa de 100%', () => {
  assert.equal(probabilidadePagamento(0), 1);
  assert.equal(probabilidadePagamento(65), 0.5);
  assert.ok(Math.abs(probabilidadePagamento(100) - (1 - 100 / 130)) < 1e-12);
});

test('a probabilidade nunca fica abaixo do piso de 15%', () => {
  assert.equal(probabilidadePagamento(200), 0.15);
  assert.equal(probabilidadePagamento(130), 0.15);
});

test('soma dos vencimentos e previsão ajustada por período', () => {
  const r = previsao(TITULOS);
  const porChave = Object.fromEntries(r.periodos.map((p) => [p.chave, p]));

  assert.deepEqual(r.periodos.map((p) => p.chave), [
    'vencidos',
    'semana-1',
    'semana-2',
    'semana-3',
    'semana-4',
  ]);

  assert.equal(porChave.vencidos.saldo, 100);
  assert.equal(porChave.vencidos.previsto, 50); // Ana: 100 × 50%
  assert.equal(porChave['semana-1'].saldo, 250);
  assert.equal(porChave['semana-1'].previsto, 185); // Ana 50 × 50% + Bruno 200 × 80%
  assert.equal(porChave['semana-2'].saldo, 300);
  assert.equal(porChave['semana-2'].previsto, 240);
  assert.equal(porChave['semana-3'].saldo, 0);
  assert.equal(porChave['semana-4'].saldo, 400);
  assert.equal(porChave['semana-4'].previsto, 400);
  assert.equal(porChave['semana-4'].diferenca, 0);
});

test('os totais somam os períodos e a diferença é soma − previsão', () => {
  const r = previsao(TITULOS);
  assert.equal(r.total.saldo, 1050);
  assert.equal(r.total.previsto, 875);
  assert.equal(r.total.diferenca, 175);
});

test('o que vence depois das 4 semanas fica fora da conta, mas é devolvido à parte', () => {
  const r = previsao(TITULOS);
  assert.equal(r.depois.saldo, 500);
  assert.equal(r.depois.previsto, 500);
  assert.equal(r.total.saldo, 1050); // sem os 500 de Carla
});

test('limites entre as semanas: dias 0-6, 7-13, 14-20, 21-27 e 28 em diante', () => {
  const dias = [
    ['2026-09-21', 'semana-1'], // dia 0
    ['2026-09-27', 'semana-1'], // dia 6
    ['2026-09-28', 'semana-2'], // dia 7
    ['2026-10-04', 'semana-2'], // dia 13
    ['2026-10-05', 'semana-3'], // dia 14
    ['2026-10-11', 'semana-3'], // dia 20
    ['2026-10-12', 'semana-4'], // dia 21
    ['2026-10-18', 'semana-4'], // dia 27
  ];
  for (const [vence, semanaEsperada] of dias) {
    const r = previsao([titulo('C', '10.00', vence)]);
    const periodo = r.periodos.find((p) => p.saldo > 0);
    assert.equal(periodo.chave, semanaEsperada, `vencimento ${vence}`);
  }
  assert.equal(previsao([titulo('C', '10.00', '2026-10-19')]).total.saldo, 0); // dia 28: depois
});

test('título atrasado vai pra "Já vencidos", qualquer que seja a data', () => {
  const r = previsao([titulo('C', '10.00', '2026-09-20', 'atrasado')]);
  assert.equal(r.periodos[0].chave, 'vencidos');
  assert.equal(r.periodos[0].saldo, 10);
});

test('cada semana mostra as datas em que começa e termina', () => {
  const r = previsao([]);
  assert.equal(r.periodos[0].de, null);
  assert.equal(r.periodos[1].de, '2026-09-21');
  assert.equal(r.periodos[1].ate, '2026-09-27');
  assert.equal(r.periodos[2].de, '2026-09-28');
  assert.equal(r.periodos[4].ate, '2026-10-18');
  assert.deepEqual(r.janela, { de: '2026-09-21', ate: '2026-10-18' });
});

test('tabela por cliente: só quem tem algo na janela, do que mais some pro que menos', () => {
  const r = previsao(TITULOS);
  assert.deepEqual(
    r.clientes.map((c) => [c.cliente.nome, c.saldo, c.previsto, c.diferenca]),
    [
      ['Bruno', 500, 400, 100],
      ['Ana', 150, 75, 75],
      ['Carla', 400, 400, 0], // os 500 de dezembro não contam; Davi (quitado) não aparece
    ]
  );
  assert.equal(r.clientes[0].probabilidade, 0.8);
});

test('cliente com título só depois das 4 semanas não entra na tabela por cliente', () => {
  const r = previsao([titulo('C', '500.00', '2026-12-01')]);
  assert.deepEqual(r.clientes, []);
  assert.equal(r.depois.saldo, 500);
});

test('tabela por cliente e totais fecham no centavo, mesmo com valores quebrados', () => {
  const titulos = [
    titulo('A', '33.33', '2026-09-22'),
    titulo('A', '33.33', '2026-09-30', 'em_aberto'),
    titulo('A', '10.01', '2026-09-01', 'atrasado'),
    titulo('B', '33.33', '2026-10-06'),
    titulo('C', '0.07', '2026-09-25'),
  ];
  const r = previsao(titulos, { A: 47, B: 91, C: 13 });

  const previstoPorClientes = r.clientes.reduce((soma, c) => soma + paraCentavos(c.previsto), 0);
  const previstoPorPeriodos = r.periodos.reduce((soma, p) => soma + paraCentavos(p.previsto), 0);
  assert.equal(previstoPorClientes, paraCentavos(r.total.previsto));
  assert.equal(previstoPorPeriodos, paraCentavos(r.total.previsto));

  const saldoPorClientes = r.clientes.reduce((soma, c) => soma + paraCentavos(c.saldo), 0);
  assert.equal(saldoPorClientes, paraCentavos(r.total.saldo));
  assert.equal(
    paraCentavos(r.total.saldo) - paraCentavos(r.total.previsto),
    paraCentavos(r.total.diferenca)
  );
});

test('sem nenhum título em aberto: tudo zerado', () => {
  const r = previsao([titulo('D', '0.00', '2026-08-01', 'pago')]);
  assert.equal(r.periodos.length, 5);
  assert.ok(r.periodos.every((p) => p.saldo === 0 && p.previsto === 0 && p.diferenca === 0));
  assert.deepEqual(r.total, { saldo: 0, previsto: 0, diferenca: 0 });
  assert.deepEqual(r.depois, { saldo: 0, previsto: 0 });
  assert.deepEqual(r.clientes, []);
});
