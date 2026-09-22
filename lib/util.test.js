import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  combinaComBusca,
  dataBrasil,
  diasEntre,
  formatarTelefoneE164,
  normalizarTexto,
  plural,
  somarDias,
} from './util.js';

test('normalizarTexto tira acento, maiúscula e espaços das pontas', () => {
  assert.equal(normalizarTexto('  José Antônio '), 'jose antonio');
  assert.equal(normalizarTexto('LÚCIA'), 'lucia');
  assert.equal(normalizarTexto('Conceição'), 'conceicao');
  assert.equal(normalizarTexto(null), '');
});

test('busca ignora acento e maiúscula, nos dois sentidos', () => {
  assert.ok(combinaComBusca('José Antônio Ramos', 'jose'));
  assert.ok(combinaComBusca('José Antônio Ramos', 'JOSÉ'));
  assert.ok(combinaComBusca('Jose Antonio Ramos', 'josé'));
  assert.ok(combinaComBusca('Lúcia Fernandes', 'lucia'));
});

test('busca acha pedaço do nome, em qualquer posição', () => {
  assert.ok(combinaComBusca('Maria Aparecida Souza', 'apar'));
  assert.ok(combinaComBusca('Maria Aparecida Souza', 'souza'));
  assert.ok(combinaComBusca('Maria Aparecida Souza', 'parec')); // do meio de uma palavra
});

test('busca com várias palavras exige todas, em qualquer ordem', () => {
  assert.ok(combinaComBusca('Maria Aparecida Souza', 'souza maria'));
  assert.ok(combinaComBusca('Maria Aparecida Souza', '  maria   souza '));
  assert.equal(combinaComBusca('Maria Aparecida Souza', 'maria lima'), false);
});

test('busca que não bate com nada não acha ninguém', () => {
  assert.equal(combinaComBusca('José Antônio Ramos', 'xyz'), false);
  assert.equal(combinaComBusca('José Antônio Ramos', 'joao'), false);
});

test('busca vazia ou só com espaços acha todo mundo', () => {
  assert.ok(combinaComBusca('José Antônio Ramos', ''));
  assert.ok(combinaComBusca('José Antônio Ramos', '   '));
  assert.ok(combinaComBusca('José Antônio Ramos', undefined));
});

test('somarDias atravessa mês e ano, pra frente e pra trás', () => {
  assert.equal(somarDias('2026-09-21', 30), '2026-10-21');
  assert.equal(somarDias('2026-12-25', 10), '2027-01-04');
  assert.equal(somarDias('2026-03-01', -1), '2026-02-28');
  assert.equal(somarDias('2028-02-28', 1), '2028-02-29'); // ano bissexto
});

test('diasEntre conta os dias de uma data até a outra', () => {
  assert.equal(diasEntre('2026-09-21', '2026-09-21'), 0);
  assert.equal(diasEntre('2026-09-14', '2026-09-21'), 7);
  assert.equal(diasEntre('2026-12-30', '2027-01-02'), 3);
  assert.equal(diasEntre('2026-09-21', '2026-09-20'), -1);
});

test('dataBrasil usa o fuso de Brasília, não o UTC', () => {
  // 01:30 UTC do dia 22 ainda é 22h30 do dia 21 em Brasília
  assert.equal(dataBrasil('2026-09-22T01:30:00+00:00'), '2026-09-21');
  assert.equal(dataBrasil('2026-09-22T03:30:00+00:00'), '2026-09-22');
});

test('plural escolhe a forma pela quantidade', () => {
  assert.equal(plural(1, 'dia', 'dias'), 'dia');
  assert.equal(plural(0, 'dia', 'dias'), 'dias');
  assert.equal(plural(2, 'dia', 'dias'), 'dias');
});

test('formatarTelefoneE164 formata celular e fixo brasileiros', () => {
  assert.equal(formatarTelefoneE164('(11) 91234-5678'), '5511912345678');
  assert.equal(formatarTelefoneE164('(21) 3333-4444'), '552133334444');
});

test('formatarTelefoneE164 aceita o número já com código do país', () => {
  assert.equal(formatarTelefoneE164('+55 11 91234-5678'), '5511912345678');
  assert.equal(formatarTelefoneE164('55 11 91234-5678'), '5511912345678');
});

test('formatarTelefoneE164 rejeita número fictício de teste e outros inválidos', () => {
  assert.equal(formatarTelefoneE164('(00) 00000-0001'), null); // clientes de teste
  assert.equal(formatarTelefoneE164('123'), null);
  assert.equal(formatarTelefoneE164(''), null);
  assert.equal(formatarTelefoneE164(null), null);
});
