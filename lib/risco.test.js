import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularRisco } from './risco.js';

const CONFIG = {
  limite_atraso: 15,
  peso_mudanca_padrao: 20,
  corte_risco_alto: 55,
  corte_risco_medio: 25,
};

// Monta um cliente: tem `abertos` títulos em aberto (o primeiro atrasado há
// `atraso` dias, ou dentro do prazo se atraso = 0; os outros dentro do prazo),
// mais os títulos já quitados pedidos.
function cliente({ atraso = 0, pagosEmDia = 0, pagosComAtraso = 0, abertos = 1 }) {
  const titulos = [];
  const ultimoPagamento = {};
  let n = 0;

  for (let i = 0; i < pagosEmDia; i++) {
    const id = `em-dia-${n++}`;
    titulos.push({ id, status: 'pago', dias_atraso: 0, data_vencimento: '2026-01-10' });
    ultimoPagamento[id] = '2026-01-10'; // pago no dia do vencimento: em dia
  }
  for (let i = 0; i < pagosComAtraso; i++) {
    const id = `com-atraso-${n++}`;
    titulos.push({ id, status: 'pago', dias_atraso: 0, data_vencimento: '2026-01-10' });
    ultimoPagamento[id] = '2026-01-15'; // pago 5 dias depois: com atraso
  }
  titulos.push({
    id: 'aberto',
    status: atraso > 0 ? 'atrasado' : 'em_aberto',
    dias_atraso: atraso,
    data_vencimento: '2026-02-01',
  });
  for (let i = 1; i < abertos; i++) {
    titulos.push({
      id: `aberto-${i}`,
      status: 'em_aberto',
      dias_atraso: 0,
      data_vencimento: '2026-02-01',
    });
  }

  return { titulos, ultimoPagamento };
}

function risco(situacao, config = CONFIG) {
  const { titulos, ultimoPagamento } = cliente(situacao);
  return calcularRisco(titulos, ultimoPagamento, config);
}

// Os mesmos exemplos aprovados na proposta da Fase 3.
const EXEMPLOS = [
  ['Maria: nova, vence hoje', { atraso: 0 }, 10, 'baixo'],
  ['Ana: nova, 3 dias atrasada', { atraso: 3 }, 22, 'baixo'],
  ['Carlos: novo, 10 dias atrasado', { atraso: 10 }, 50, 'medio'],
  ['Lúcia: nova, 20 dias atrasada', { atraso: 20 }, 70, 'alto'],
  ['Zé: antigo, 4 pagos em dia, em dia hoje', { pagosEmDia: 4 }, 0, 'baixo'],
  ['João: antigo, 4 pagos em dia, 5 dias atrasado', { pagosEmDia: 4, atraso: 5 }, 40, 'medio'],
  [
    'Pedro: antigo, 3 pagos (2 com atraso), 10 dias atrasado',
    { pagosEmDia: 1, pagosComAtraso: 2, atraso: 10 },
    53.33,
    'medio',
  ],
  ['Rita: antiga, 4 pagos (3 com atraso), em dia hoje', { pagosEmDia: 1, pagosComAtraso: 3 }, 15, 'baixo'],
];

for (const [nome, situacao, notaEsperada, nivelEsperado] of EXEMPLOS) {
  test(nome, () => {
    const r = risco(situacao);
    assert.equal(r.nota, notaEsperada);
    assert.equal(r.nivel, nivelEsperado);
  });
}

test('cliente sem nenhum título: nota 0 e motivo "Ainda sem compras"', () => {
  const r = calcularRisco([], {}, CONFIG);
  assert.equal(r.nota, 0);
  assert.equal(r.nivel, 'baixo');
  assert.deepEqual(r.motivos, ['Ainda sem compras']);
});

test('cliente novo vira médio com 4 dias e alto com 12; antigo em dia, com 7 e 14', () => {
  assert.equal(risco({ atraso: 3 }).nivel, 'baixo');
  assert.equal(risco({ atraso: 4 }).nivel, 'medio');
  assert.equal(risco({ atraso: 11 }).nivel, 'medio');
  assert.equal(risco({ atraso: 12 }).nivel, 'alto');

  // 2 pagos em dia: antigo, mas ainda sem "mudança de padrão" (exige 3)
  assert.equal(risco({ pagosEmDia: 2, atraso: 6 }).nivel, 'baixo');
  assert.equal(risco({ pagosEmDia: 2, atraso: 7 }).nivel, 'medio');
  assert.equal(risco({ pagosEmDia: 2, atraso: 13 }).nivel, 'medio');
  assert.equal(risco({ pagosEmDia: 2, atraso: 14 }).nivel, 'alto');
});

test('o atraso satura em 60 pontos, mesmo com atraso enorme', () => {
  const r = risco({ pagosEmDia: 5, atraso: 400 });
  assert.equal(r.partes.atraso, 60);
  assert.equal(r.nota, 80); // 60 (atraso, no teto) + 0 (perfil) + 20 (mudança)
});

test('a nota nunca passa de 100, mesmo se a configuração somar mais', () => {
  const r = risco({ pagosEmDia: 5, atraso: 400 }, { ...CONFIG, peso_mudanca_padrao: 60 });
  assert.equal(r.nota, 100); // 60 + 0 + 60 = 120, limitado a 100
});

test('usa os parâmetros da configuração (limite de atraso e cortes)', () => {
  const rigoroso = { ...CONFIG, limite_atraso: 5, corte_risco_alto: 40 };
  const r = risco({ atraso: 5 }, rigoroso); // 60 (teto) + 10 (novo) = 70
  assert.equal(r.nota, 70);
  assert.equal(r.nivel, 'alto');
});

test('quitado no dia do vencimento é em dia; um dia depois é com atraso', () => {
  const titulos = [{ id: 't1', status: 'pago', dias_atraso: 0, data_vencimento: '2026-03-10' }];
  const emDia = calcularRisco(titulos, { t1: '2026-03-10' }, CONFIG);
  const atrasado = calcularRisco(titulos, { t1: '2026-03-11' }, CONFIG);
  assert.equal(emDia.partes.perfil, 0);
  assert.equal(atrasado.partes.perfil, 20);
});

test('mais de um título aberto soma 15, e é 15 fixo (não por título)', () => {
  const um = risco({ pagosEmDia: 4 });
  const dois = risco({ pagosEmDia: 4, abertos: 2 });
  const cinco = risco({ pagosEmDia: 4, abertos: 5 });
  assert.equal(um.partes.varios, 0);
  assert.equal(dois.partes.varios, 15);
  assert.equal(dois.nota, 15);
  assert.equal(cinco.nota, 15);
});

test('título quitado não conta como "aberto ao mesmo tempo"', () => {
  // 1 aberto + 5 quitados: continua sendo só um título aberto
  assert.equal(risco({ pagosEmDia: 5 }).partes.varios, 0);
});

test('cliente novo com dois títulos abertos já cai no médio, mesmo sem atraso', () => {
  const r = risco({ abertos: 2 }); // 10 (novo) + 15 (vários abertos)
  assert.equal(r.nota, 25);
  assert.equal(r.nivel, 'medio');
});

test('vários abertos entram na soma com o atraso e a nota continua limitada a 100', () => {
  const r = risco({ pagosEmDia: 5, atraso: 400, abertos: 2 }); // 60 + 0 + 20 + 15
  assert.equal(r.nota, 95);
  assert.equal(risco({ pagosEmDia: 5, atraso: 400, abertos: 2 }, { ...CONFIG, peso_mudanca_padrao: 60 }).nota, 100);
});

test('motivos em português para cada situação', () => {
  assert.deepEqual(risco({ atraso: 10 }).motivos, [
    'Atrasado há 10 dias',
    'Cliente novo, ainda sem histórico de pagamento',
  ]);
  assert.deepEqual(risco({ pagosEmDia: 4, atraso: 1 }).motivos, [
    'Atrasado há 1 dia',
    'Sempre pagou em dia e agora atrasou',
  ]);
  assert.deepEqual(risco({ pagosEmDia: 1, pagosComAtraso: 1, atraso: 2 }).motivos, [
    'Atrasado há 2 dias',
    'Já pagou 1 de 2 títulos com atraso',
  ]);
  assert.deepEqual(risco({ pagosEmDia: 3 }).motivos, ['Sempre pagou em dia']);
  assert.deepEqual(risco({ pagosEmDia: 3, abertos: 2 }).motivos, [
    '2 títulos em aberto ao mesmo tempo',
    'Sempre pagou em dia',
  ]);
});
