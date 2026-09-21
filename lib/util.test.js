import { test } from 'node:test';
import assert from 'node:assert/strict';
import { combinaComBusca, normalizarTexto } from './util.js';

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
