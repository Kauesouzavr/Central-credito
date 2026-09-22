import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarMensagemWhatsApp } from './mensagens-whatsapp.js';

const CLIENTE = { id: 'c1', nome: 'Ana Beatriz Lima' };

test('antes_vencimento: primeiro nome, singular/plural certo, valor e data por extenso', () => {
  const msg = montarMensagemWhatsApp({
    tipo: 'antes_vencimento',
    cliente: CLIENTE,
    titulo: { valor_restante: 89.9, data_vencimento: '2026-09-24' },
    dias: 3,
  });
  assert.equal(msg.tipo, 'antes_vencimento');
  assert.equal(
    msg.texto,
    'Olá, Ana! Passando para lembrar que seu título de R$ 89,90 vence em 3 dias, no dia 24/09/2026.'
  );
});

test('antes_vencimento com 1 dia usa singular', () => {
  const msg = montarMensagemWhatsApp({
    tipo: 'antes_vencimento',
    cliente: CLIENTE,
    titulo: { valor_restante: 50, data_vencimento: '2026-09-22' },
    dias: 1,
  });
  assert.match(msg.texto, /vence em 1 dia,/);
});

test('vencimento: usa o primeiro nome do cliente', () => {
  const msg = montarMensagemWhatsApp({
    tipo: 'vencimento',
    cliente: { id: 'c2', nome: 'José Antônio Ramos' },
    titulo: { valor_restante: 150, data_vencimento: '2026-09-21' },
  });
  assert.equal(msg.tipo, 'vencimento');
  assert.equal(msg.texto, 'Olá, José! Seu título de R$ 150,00 vence hoje (21/09/2026).');
});

test('atraso: um título só menciona valor e data dele', () => {
  const msg = montarMensagemWhatsApp({
    tipo: 'atraso',
    cliente: CLIENTE,
    titulos: [{ data_vencimento: '2026-09-01' }],
    totalRestante: 420,
    maiorAtraso: 20,
  });
  assert.equal(msg.tipo, 'atraso');
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
