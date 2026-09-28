import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  combinaComBusca,
  dataBrasil,
  diasEntre,
  formatarCepDigitado,
  formatarMoedaDigitada,
  formatarTelefoneDigitado,
  formatarTelefoneE164,
  inicioDoDiaBrasil,
  lerValor,
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

test('inicioDoDiaBrasil converte meia-noite de Brasília pra UTC', () => {
  assert.equal(inicioDoDiaBrasil('2026-09-21'), '2026-09-21T03:00:00.000Z');
});

test('formatarTelefoneE164 rejeita número fictício de teste e outros inválidos', () => {
  assert.equal(formatarTelefoneE164('(00) 00000-0001'), null); // clientes de teste
  assert.equal(formatarTelefoneE164('123'), null);
  assert.equal(formatarTelefoneE164(''), null);
  assert.equal(formatarTelefoneE164(null), null);
});

test('lerValor lê vírgula, ponto e separador de milhar', () => {
  assert.equal(lerValor('50,00'), 50);
  assert.equal(lerValor('50.00'), 50);
  assert.equal(lerValor('1.234,56'), 1234.56);
  assert.equal(lerValor('0'), null);
  assert.equal(lerValor('-5'), null);
  assert.equal(lerValor('abc'), null);
});

test('formatarMoedaDigitada formata dígitos como centavos', () => {
  assert.equal(formatarMoedaDigitada('5000'), '50,00');
  assert.equal(formatarMoedaDigitada('123456'), '1.234,56');
  assert.equal(formatarMoedaDigitada('5'), '0,05');
  assert.equal(formatarMoedaDigitada(''), '');
  assert.equal(formatarMoedaDigitada('R$ 50,00'), '50,00');
});

test('formatarTelefoneDigitado formata celular e fixo conforme digita', () => {
  assert.equal(formatarTelefoneDigitado('1'), '(1');
  assert.equal(formatarTelefoneDigitado('11'), '(11');
  assert.equal(formatarTelefoneDigitado('1199999'), '(11) 99999');
  assert.equal(formatarTelefoneDigitado('11999998888'), '(11) 99999-8888');
  assert.equal(formatarTelefoneDigitado('2133334444'), '(21) 3333-4444');
  assert.equal(formatarTelefoneDigitado('119999988889999'), '(11) 99999-8888'); // trunca em 11 dígitos
});

test('formatarCepDigitado formata conforme digita', () => {
  assert.equal(formatarCepDigitado('27'), '27');
  assert.equal(formatarCepDigitado('27200'), '27200');
  assert.equal(formatarCepDigitado('27200000'), '27200-000');
  assert.equal(formatarCepDigitado('27.200-000'), '27200-000');
});
