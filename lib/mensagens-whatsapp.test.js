import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarMensagemWhatsApp } from './mensagens-whatsapp.js';

const CLIENTE = { id: 'c1', nome: 'Ana Beatriz Lima' };

test('antes_vencimento: template e parâmetros na ordem certa', () => {
  const msg = montarMensagemWhatsApp({
    tipo: 'antes_vencimento',
    cliente: CLIENTE,
    titulo: { valor_restante: 89.9, data_vencimento: '2026-09-24' },
    dias: 3,
  });
  assert.equal(msg.template, 'aviso_vencimento');
  assert.deepEqual(msg.parametros, ['Ana', 'R$ 89,90', '3', '24/09/2026']);
  assert.match(msg.texto, /^Olá, Ana! Passando para lembrar/);
  assert.match(msg.texto, /vence em 3 dias/);
});

test('vencimento: usa singular/plural certo e nome de exibição é o primeiro nome', () => {
  const msg = montarMensagemWhatsApp({
    tipo: 'vencimento',
    cliente: { id: 'c2', nome: 'José Antônio Ramos' },
    titulo: { valor_restante: 150, data_vencimento: '2026-09-21' },
  });
  assert.equal(msg.template, 'vencimento_hoje');
  assert.equal(msg.parametros[0], 'José');
  assert.match(msg.texto, /vence hoje \(21\/09\/2026\)/);
});

test('atraso: um título só menciona valor e data dele', () => {
  const msg = montarMensagemWhatsApp({
    tipo: 'atraso',
    cliente: CLIENTE,
    titulos: [{ data_vencimento: '2026-09-01' }],
    totalRestante: 420,
    maiorAtraso: 20,
  });
  assert.equal(msg.template, 'cobranca_atraso');
  assert.match(msg.texto, /seu título de R\$ 420,00, vencido em 01\/09\/2026,/);
  assert.match(msg.texto, /em aberto há 20 dias/);
});

test('atraso: vários títulos soma o valor e não cita uma data só', () => {
  const msg = montarMensagemWhatsApp({
    tipo: 'atraso',
    cliente: CLIENTE,
    titulos: [{ data_vencimento: '2026-09-01' }, { data_vencimento: '2026-09-11' }],
    totalRestante: 960,
    maiorAtraso: 16,
  });
  assert.match(msg.texto, /seus 2 títulos em aberto, somando R\$ 960,00,/);
});

test('tipo desconhecido lança erro em vez de mandar mensagem errada', () => {
  assert.throws(() => montarMensagemWhatsApp({ tipo: 'cadastro', cliente: CLIENTE }));
});
