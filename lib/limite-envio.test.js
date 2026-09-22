import { test } from 'node:test';
import assert from 'node:assert/strict';
import { atrasoAleatorioMs, podeEnviarMais } from './limite-envio.js';

test('podeEnviarMais libera quando está abaixo dos dois limites', () => {
  assert.equal(
    podeEnviarMais({ enviadasUltimaHora: 5, enviadasHoje: 30, limitePorHora: 20, limitePorDia: 100 }),
    true
  );
});

test('podeEnviarMais bloqueia ao atingir o limite por hora', () => {
  assert.equal(
    podeEnviarMais({ enviadasUltimaHora: 20, enviadasHoje: 30, limitePorHora: 20, limitePorDia: 100 }),
    false
  );
});

test('podeEnviarMais bloqueia ao atingir o limite por dia, mesmo com a hora livre', () => {
  assert.equal(
    podeEnviarMais({ enviadasUltimaHora: 0, enviadasHoje: 100, limitePorHora: 20, limitePorDia: 100 }),
    false
  );
});

test('podeEnviarMais sem limite configurado (null) nunca bloqueia por essa conta', () => {
  assert.equal(
    podeEnviarMais({ enviadasUltimaHora: 999, enviadasHoje: 999, limitePorHora: null, limitePorDia: null }),
    true
  );
});

test('atrasoAleatorioMs sempre cai dentro da faixa pedida (em ms)', () => {
  for (let i = 0; i < 200; i++) {
    const ms = atrasoAleatorioMs(20, 90);
    assert.ok(ms >= 20_000 && ms <= 90_000, `${ms} fora da faixa`);
  }
});

test('atrasoAleatorioMs funciona mesmo se min e max vierem trocados', () => {
  for (let i = 0; i < 50; i++) {
    const ms = atrasoAleatorioMs(90, 20);
    assert.ok(ms >= 20_000 && ms <= 90_000, `${ms} fora da faixa`);
  }
});

test('atrasoAleatorioMs com min igual a max devolve sempre o mesmo valor', () => {
  assert.equal(atrasoAleatorioMs(30, 30), 30_000);
});
