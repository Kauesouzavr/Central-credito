import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demoAtiva, destinoSeguroDemo, operacaoDestrutivaAutorizada } from './demo-guard.js';

const AMBIENTE_DEMO = {
  DEMO_MODE: '1',
  DEMO_SUPABASE_REF: 'abcdefghij',
  SUPABASE_URL: 'https://abcdefghij.supabase.co',
};

test('demoAtiva só aceita exatamente "1"', () => {
  assert.equal(demoAtiva({ DEMO_MODE: '1' }), true);
  assert.equal(demoAtiva({ DEMO_MODE: 'true' }), false);
  assert.equal(demoAtiva({ DEMO_MODE: '0' }), false);
  assert.equal(demoAtiva({ DEMO_MODE: '' }), false);
  assert.equal(demoAtiva({}), false);
});

test('autoriza quando DEMO_MODE=1 e o host é exatamente o do projeto demo', () => {
  assert.equal(operacaoDestrutivaAutorizada(AMBIENTE_DEMO), true);
});

test('recusa sem DEMO_MODE, mesmo com o host certo', () => {
  assert.equal(operacaoDestrutivaAutorizada({ ...AMBIENTE_DEMO, DEMO_MODE: undefined }), false);
  assert.equal(operacaoDestrutivaAutorizada({ ...AMBIENTE_DEMO, DEMO_MODE: '0' }), false);
});

test('recusa se o host é de outro projeto (o banco real)', () => {
  assert.equal(operacaoDestrutivaAutorizada({ ...AMBIENTE_DEMO, SUPABASE_URL: 'https://zzzzzzzzzz.supabase.co' }), false);
});

test('recusa hosts parecidos com o da demo', () => {
  const casos = [
    'https://abcdefghij.supabase.co.evil.com',
    'https://xabcdefghij.supabase.co',
    'https://abcdefghijx.supabase.co',
    'https://abcdefghij.supabase.co:8443',
    'https://abcdefghij.supabase.co@evil.com',
    'https://evil.com/abcdefghij.supabase.co',
    'https://ABCDEFGHIJ.example.co',
  ];
  for (const SUPABASE_URL of casos) {
    assert.equal(operacaoDestrutivaAutorizada({ ...AMBIENTE_DEMO, SUPABASE_URL }), false, SUPABASE_URL);
  }
});

test('recusa quando faltam variáveis ou a URL é inválida', () => {
  assert.equal(operacaoDestrutivaAutorizada({ ...AMBIENTE_DEMO, DEMO_SUPABASE_REF: '' }), false);
  assert.equal(operacaoDestrutivaAutorizada({ ...AMBIENTE_DEMO, DEMO_SUPABASE_REF: undefined }), false);
  assert.equal(operacaoDestrutivaAutorizada({ ...AMBIENTE_DEMO, SUPABASE_URL: '' }), false);
  assert.equal(operacaoDestrutivaAutorizada({ ...AMBIENTE_DEMO, SUPABASE_URL: 'isso nao e uma url' }), false);
  assert.equal(operacaoDestrutivaAutorizada({}), false);
});

test('destinoSeguroDemo aceita só caminhos do próprio site', () => {
  assert.equal(destinoSeguroDemo('/'), '/');
  assert.equal(destinoSeguroDemo('/clientes'), '/clientes');
  assert.equal(destinoSeguroDemo('/clientes?novo=1'), '/clientes?novo=1');
  assert.equal(destinoSeguroDemo('/clientes/abc-123'), '/clientes/abc-123');
});

test('destinoSeguroDemo recusa outros endereços, login e rotas internas', () => {
  const casos = [
    undefined,
    null,
    '',
    'clientes',
    '//evil.com',
    '/\\evil.com',
    'https://evil.com',
    'javascript:alert(1)',
    '/login',
    '/login?erro=x',
    '/api/demo/reset',
    '/api/exportar-csv',
    '/a\nb',
  ];
  for (const caso of casos) {
    assert.equal(destinoSeguroDemo(caso), '/', String(caso));
  }
});
