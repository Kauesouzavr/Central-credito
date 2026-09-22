import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarRegua } from './regua.js';

const HOJE = '2026-09-21';
const CLIENTE = { id: 'c1', nome: 'Ana Beatriz Lima', telefone: '(11) 91234-5678' };

function titulo(overrides) {
  return {
    id: 't1',
    cliente_id: 'c1',
    valor_restante: 100,
    data_vencimento: HOJE,
    dias_atraso: 0,
    status: 'em_aberto',
    ...overrides,
  };
}

test('avisa "antes do vencimento" quando faltam exatamente os dias configurados', () => {
  const envios = montarRegua({
    titulos: [titulo({ data_vencimento: '2026-09-24', status: 'em_aberto' })],
    clientes: [CLIENTE],
    mensagensEnviadas: [],
    hoje: HOJE,
    diasAntesAviso: 3,
    diasRepetirCobranca: 7,
  });
  assert.equal(envios.length, 1);
  assert.equal(envios[0].tipo, 'antes_vencimento');
  assert.equal(envios[0].dias, 3);
});

test('avisa "antes do vencimento" mesmo passado o dia exato (bot ficou fora do ar), com os dias reais', () => {
  const envios = montarRegua({
    titulos: [titulo({ data_vencimento: '2026-09-22', status: 'em_aberto' })], // faltava 1 dia, não 3
    clientes: [CLIENTE],
    mensagensEnviadas: [],
    hoje: HOJE,
    diasAntesAviso: 3,
    diasRepetirCobranca: 7,
  });
  assert.equal(envios.length, 1);
  assert.equal(envios[0].tipo, 'antes_vencimento');
  assert.equal(envios[0].dias, 1); // usa quantos dias faltam de verdade, não o configurado
});

test('não avisa de novo "antes do vencimento" se já avisou esse título', () => {
  const envios = montarRegua({
    titulos: [titulo({ id: 't1', data_vencimento: '2026-09-24', status: 'em_aberto' })],
    clientes: [CLIENTE],
    mensagensEnviadas: [{ tipo: 'antes_vencimento', titulo_id: 't1', cliente_id: 'c1', enviado_em: `${HOJE}T09:00:00Z` }],
    hoje: HOJE,
    diasAntesAviso: 3,
    diasRepetirCobranca: 7,
  });
  assert.equal(envios.length, 0);
});

test('avisa "vence hoje" e só uma vez por título', () => {
  const semAviso = montarRegua({
    titulos: [titulo({ id: 't1', data_vencimento: HOJE, status: 'em_aberto' })],
    clientes: [CLIENTE],
    mensagensEnviadas: [],
    hoje: HOJE,
    diasAntesAviso: 3,
    diasRepetirCobranca: 7,
  });
  assert.equal(semAviso.length, 1);
  assert.equal(semAviso[0].tipo, 'vencimento');

  const comAviso = montarRegua({
    titulos: [titulo({ id: 't1', data_vencimento: HOJE, status: 'em_aberto' })],
    clientes: [CLIENTE],
    mensagensEnviadas: [{ tipo: 'vencimento', titulo_id: 't1', cliente_id: 'c1', enviado_em: `${HOJE}T09:00:00Z` }],
    hoje: HOJE,
    diasAntesAviso: 3,
    diasRepetirCobranca: 7,
  });
  assert.equal(comAviso.length, 0);
});

test('cobra atraso juntando todos os títulos atrasados do cliente numa mensagem só', () => {
  const envios = montarRegua({
    titulos: [
      titulo({ id: 't1', status: 'atrasado', valor_restante: 100, dias_atraso: 5, data_vencimento: '2026-09-16' }),
      titulo({ id: 't2', status: 'atrasado', valor_restante: 50, dias_atraso: 12, data_vencimento: '2026-09-09' }),
    ],
    clientes: [CLIENTE],
    mensagensEnviadas: [],
    hoje: HOJE,
    diasAntesAviso: 3,
    diasRepetirCobranca: 7,
  });
  assert.equal(envios.length, 1);
  assert.equal(envios[0].tipo, 'atraso');
  assert.equal(envios[0].titulos.length, 2);
  assert.equal(envios[0].totalRestante, 150);
  assert.equal(envios[0].maiorAtraso, 12); // o pior atraso entre os títulos, não a soma
});

test('não cobra de novo antes de "dias repetir cobrança" passar', () => {
  const envios = montarRegua({
    titulos: [titulo({ id: 't1', status: 'atrasado', dias_atraso: 5, data_vencimento: '2026-09-16' })],
    clientes: [CLIENTE],
    mensagensEnviadas: [{ tipo: 'atraso', titulo_id: 't1', cliente_id: 'c1', enviado_em: '2026-09-18T09:00:00Z' }], // 3 dias atrás
    hoje: HOJE,
    diasAntesAviso: 3,
    diasRepetirCobranca: 7,
  });
  assert.equal(envios.length, 0);
});

test('cobra de novo assim que "dias repetir cobrança" passa', () => {
  const envios = montarRegua({
    titulos: [titulo({ id: 't1', status: 'atrasado', dias_atraso: 12, data_vencimento: '2026-09-09' })],
    clientes: [CLIENTE],
    mensagensEnviadas: [{ tipo: 'atraso', titulo_id: 't1', cliente_id: 'c1', enviado_em: '2026-09-14T09:00:00Z' }], // 7 dias atrás
    hoje: HOJE,
    diasAntesAviso: 3,
    diasRepetirCobranca: 7,
  });
  assert.equal(envios.length, 1);
});

test('a última cobrança usa o fuso de Brasília, não a data UTC crua', () => {
  // 2026-09-21T01:30:00Z é 20/09 22:30 em Brasília — um "slice" ingênuo do UTC
  // erraria pro dia 21, folgando 1 dia a menos na contagem de diasRepetirCobranca.
  const envios = montarRegua({
    titulos: [titulo({ id: 't1', status: 'atrasado', dias_atraso: 12, data_vencimento: '2026-09-09' })],
    clientes: [CLIENTE],
    mensagensEnviadas: [{ tipo: 'atraso', titulo_id: 't1', cliente_id: 'c1', enviado_em: '2026-09-21T01:30:00Z' }],
    hoje: '2026-09-27', // exatamente 7 dias depois de 20/09 (Brasília), não de 21/09
    diasAntesAviso: 3,
    diasRepetirCobranca: 7,
  });
  assert.equal(envios.length, 1);
});

test('título pago não gera nenhum envio', () => {
  const envios = montarRegua({
    titulos: [titulo({ status: 'pago' })],
    clientes: [CLIENTE],
    mensagensEnviadas: [],
    hoje: HOJE,
    diasAntesAviso: 3,
    diasRepetirCobranca: 7,
  });
  assert.equal(envios.length, 0);
});

test('título de cliente que não existe mais é ignorado, sem quebrar', () => {
  const envios = montarRegua({
    titulos: [titulo({ cliente_id: 'fantasma', status: 'atrasado', dias_atraso: 5 })],
    clientes: [CLIENTE],
    mensagensEnviadas: [],
    hoje: HOJE,
    diasAntesAviso: 3,
    diasRepetirCobranca: 7,
  });
  assert.equal(envios.length, 0);
});
