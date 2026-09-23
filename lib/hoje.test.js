import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MARCA_COBRANCA_MANUAL, montarHoje } from './hoje.js';

const HOJE = '2026-09-21';

const CLIENTES = [
  { id: 'A', nome: 'Ana', telefone: '(11) 90000-0001' },
  { id: 'B', nome: 'Bruno', telefone: '(11) 90000-0002' },
  { id: 'C', nome: 'Carla', telefone: '(11) 90000-0003' },
  { id: 'D', nome: 'Davi', telefone: '(11) 90000-0004' },
  { id: 'E', nome: 'Eva', telefone: '(11) 90000-0005' },
];

function titulo(clienteId, status, valorRestante, { atraso = 0, vence = '2026-12-31' } = {}) {
  return {
    id: `${clienteId}-${status}-${valorRestante}-${vence}`,
    cliente_id: clienteId,
    status,
    valor_restante: valorRestante,
    dias_atraso: atraso,
    data_vencimento: vence,
  };
}

const TITULOS = [
  titulo('A', 'atrasado', '100.00', { atraso: 20, vence: '2026-09-01' }),
  titulo('A', 'atrasado', '50.00', { atraso: 5, vence: '2026-09-16' }),
  titulo('B', 'atrasado', '200.00', { atraso: 3, vence: '2026-09-18' }),
  titulo('C', 'em_aberto', '80.00', { vence: '2026-09-21' }), // vence hoje
  titulo('C', 'em_aberto', '20.00', { vence: '2026-10-21' }), // hoje + 30: ainda entra
  titulo('D', 'em_aberto', '999.00', { vence: '2026-10-22' }), // hoje + 31: fora
  titulo('D', 'pago', '0.00', { vence: '2026-08-01' }), // quitado: ignorado
  titulo('E', 'atrasado', '60.00', { atraso: 8, vence: '2026-09-13' }),
];

const RISCOS = {
  A: { nota: 80, nivel: 'alto', motivos: ['Atrasado há 20 dias'] },
  B: { nota: 40, nivel: 'medio', motivos: ['Atrasado há 3 dias'] },
  C: { nota: 10, nivel: 'baixo', motivos: ['Cliente novo'] },
  D: { nota: 10, nivel: 'baixo', motivos: ['Cliente novo'] },
  E: { nota: 30, nivel: 'medio', motivos: ['Atrasado há 8 dias'] },
};

const COBRANCAS = [
  // Eva: cobrada há 2 dias pelo botão "Já cobrei" -> fora da fila por enquanto
  { id: 'm1', cliente_id: 'E', enviado_em: '2026-09-19T15:00:00+00:00', texto: MARCA_COBRANCA_MANUAL },
  // Bruno: cobrado há exatamente 7 dias -> volta pra fila
  { id: 'm2', cliente_id: 'B', enviado_em: '2026-09-14T15:00:00+00:00', texto: 'Oi, tudo bem?' },
];

function hoje(mudancas = {}) {
  return montarHoje({
    titulos: TITULOS,
    clientes: CLIENTES,
    cobrancas: COBRANCAS,
    riscoDe: (id) => RISCOS[id],
    diasRepetirCobranca: 7,
    hoje: HOJE,
    ...mudancas,
  });
}

test('os cinco números do topo', () => {
  const r = hoje();
  assert.equal(r.totalVencido, 410); // 100 + 50 + 200 + 60
  assert.equal(r.totalAberto, 1509); // 410 vencido + 100 (Carla) + 999 (Davi)
  assert.equal(r.clientesAtencao, 4); // Ana, Bruno, Eva (atrasados) + Carla (vence hoje)
  assert.equal(r.nuncaCobrados, 1); // só a Ana: Bruno e Eva já foram cobrados
  assert.equal(r.atrasoMaisAntigo, 20);
  assert.equal(r.atrasoMaisAntigoCliente, 'Ana');
  assert.equal(r.aVencer30Dias, 100); // Carla: 80 (hoje) + 20 (dia 30); Davi fica de fora
});

test('a fila vai do maior risco pro menor e tira quem foi cobrado há pouco', () => {
  const r = hoje();
  assert.deepEqual(
    r.fila.map((l) => l.cliente.nome),
    ['Ana', 'Bruno']
  );
  assert.equal(r.fila[0].totalAtrasado, 150);
  assert.equal(r.fila[0].titulosAtrasados, 2);
  assert.equal(r.fila[0].maiorAtraso, 20);
  assert.equal(r.fila[0].ultimaCobranca, null);
  assert.equal(r.fila[1].ultimaCobranca, '2026-09-14');
});

test('cobrado há menos de "repetir cobrança" dias vai pra lista de cobrados', () => {
  const r = hoje();
  assert.equal(r.cobradosRecentemente.length, 1);
  const eva = r.cobradosRecentemente[0];
  assert.equal(eva.cliente.nome, 'Eva');
  assert.equal(eva.cobranca.id, 'm1');
  assert.equal(eva.cobranca.data, '2026-09-19');
  assert.equal(eva.cobranca.podeDesfazer, true);
});

test('só a cobrança feita pelo botão "Já cobrei" pode ser desfeita', () => {
  const r = hoje({
    cobrancas: [{ id: 'z', cliente_id: 'E', enviado_em: '2026-09-20T12:00:00+00:00', texto: 'Oi, Eva!' }],
  });
  assert.equal(r.cobradosRecentemente[0].cobranca.podeDesfazer, false);
});

test('passado o prazo de repetir, o cliente volta pra fila; com prazo 0, ninguém sai dela', () => {
  assert.deepEqual(
    hoje({ diasRepetirCobranca: 2 }).fila.map((l) => l.cliente.nome),
    ['Ana', 'Bruno', 'Eva'] // Eva foi cobrada há 2 dias: já passou
  );
  assert.equal(hoje({ diasRepetirCobranca: 0 }).cobradosRecentemente.length, 0);
});

test('vale a cobrança mais recente do cliente, não a primeira da lista', () => {
  const r = hoje({
    cobrancas: [
      { id: 'novo', cliente_id: 'B', enviado_em: '2026-09-20T12:00:00+00:00', texto: MARCA_COBRANCA_MANUAL },
      { id: 'velho', cliente_id: 'B', enviado_em: '2026-08-01T12:00:00+00:00', texto: MARCA_COBRANCA_MANUAL },
    ],
  });
  const bruno = r.cobradosRecentemente.find((l) => l.cliente.nome === 'Bruno');
  assert.equal(bruno.cobranca.id, 'novo');
});

test('quem vence hoje aparece na lista de vencem hoje', () => {
  const r = hoje();
  assert.equal(r.vencemHoje.length, 1);
  assert.equal(r.vencemHoje[0].cliente.nome, 'Carla');
  assert.equal(r.vencemHoje[0].total, 80);
  assert.equal(r.vencemHoje[0].titulos, 1);
});

test('o destaque é o cliente de maior risco', () => {
  const r = hoje();
  assert.equal(r.maiorRisco.cliente.nome, 'Ana');
  assert.equal(r.maiorRisco.emAberto, 150);
});

test('sem ninguém em risco médio ou alto, não há destaque', () => {
  const r = hoje({ riscoDe: () => ({ nota: 10, nivel: 'baixo', motivos: [] }) });
  assert.equal(r.maiorRisco, null);
});

test('sem nenhum título em aberto: tudo zerado e listas vazias', () => {
  const r = hoje({ titulos: [titulo('D', 'pago', '0.00')] });
  assert.equal(r.totalVencido, 0);
  assert.equal(r.totalAberto, 0);
  assert.equal(r.clientesAtencao, 0);
  assert.equal(r.nuncaCobrados, 0);
  assert.equal(r.atrasoMaisAntigo, 0);
  assert.equal(r.atrasoMaisAntigoCliente, null);
  assert.equal(r.aVencer30Dias, 0);
  assert.equal(r.maiorRisco, null);
  assert.deepEqual(r.fila, []);
  assert.deepEqual(r.cobradosRecentemente, []);
  assert.deepEqual(r.vencemHoje, []);
});

test('centavos somam certo (sem erro de ponto flutuante)', () => {
  const r = hoje({
    titulos: [
      titulo('A', 'atrasado', '0.10', { atraso: 1 }),
      titulo('A', 'atrasado', '0.20', { atraso: 1 }),
    ],
  });
  assert.equal(r.totalVencido, 0.3);
});

test('mesmo risco: desempata por mais dias de atraso e depois por maior valor', () => {
  const igual = { nota: 50, nivel: 'medio', motivos: [] };
  const r = hoje({
    titulos: [
      titulo('A', 'atrasado', '10.00', { atraso: 4 }),
      titulo('B', 'atrasado', '10.00', { atraso: 9 }),
      titulo('C', 'atrasado', '500.00', { atraso: 4 }),
    ],
    cobrancas: [],
    riscoDe: () => igual,
  });
  assert.deepEqual(
    r.fila.map((l) => l.cliente.nome),
    ['Bruno', 'Carla', 'Ana']
  );
});

test('a data da cobrança usa o fuso de Brasília', () => {
  // 01:00 UTC de 22/09 ainda é 21/09 em Brasília: cobrada "hoje"
  const r = hoje({
    cobrancas: [{ id: 'm', cliente_id: 'E', enviado_em: '2026-09-22T01:00:00+00:00', texto: MARCA_COBRANCA_MANUAL }],
  });
  assert.equal(r.cobradosRecentemente.find((l) => l.cliente.nome === 'Eva').cobranca.data, '2026-09-21');
});
