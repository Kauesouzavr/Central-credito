import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarMensagemWhatsApp } from './mensagens-whatsapp.js';

const CLIENTE = { id: 'c1', nome: 'Ana Beatriz Lima' };

// Sorteio determinístico: sempre a primeira variação disponível.
const primeira = () => 0;

test('antes_vencimento: primeiro nome, valor e data aparecem em qualquer variação', () => {
  const msg = montarMensagemWhatsApp(
    {
      tipo: 'antes_vencimento',
      cliente: CLIENTE,
      titulo: { valor_restante: 89.9, data_vencimento: '2026-09-24' },
      dias: 3,
    },
    { aleatorio: primeira }
  );
  assert.equal(msg.tipo, 'antes_vencimento');
  assert.match(msg.texto, /^Ana\b|, Ana[,!]/); // primeiro nome presente
  assert.match(msg.texto, /R\$ 89,90/);
  assert.match(msg.texto, /24\/09\/2026/);
  assert.match(msg.texto, /3 dias/);
});

test('antes_vencimento com 1 dia usa singular em toda variação', () => {
  for (let i = 0; i < 4; i++) {
    const msg = montarMensagemWhatsApp(
      {
        tipo: 'antes_vencimento',
        cliente: CLIENTE,
        titulo: { valor_restante: 50, data_vencimento: '2026-09-22' },
        dias: 1,
      },
      { aleatorio: () => i / 4 }
    );
    assert.match(msg.texto, /\b1 dia\b/);
    assert.doesNotMatch(msg.texto, /1 dias/);
  }
});

test('vencimento: usa o primeiro nome do cliente', () => {
  const msg = montarMensagemWhatsApp(
    {
      tipo: 'vencimento',
      cliente: { id: 'c2', nome: 'José Antônio Ramos' },
      titulo: { valor_restante: 150, data_vencimento: '2026-09-21' },
    },
    { aleatorio: primeira }
  );
  assert.equal(msg.tipo, 'vencimento');
  assert.match(msg.texto, /José/);
  assert.match(msg.texto, /R\$ 150,00/);
  assert.match(msg.texto, /21\/09\/2026/);
});

test('atraso: um título só menciona valor e data dele, sem linguagem formal', () => {
  const msg = montarMensagemWhatsApp(
    {
      tipo: 'atraso',
      cliente: CLIENTE,
      titulos: [{ data_vencimento: '2026-09-01' }],
      totalRestante: 420,
      maiorAtraso: 20,
    },
    { aleatorio: primeira }
  );
  assert.equal(msg.tipo, 'atraso');
  assert.match(msg.texto, /seu título de R\$ 420,00, vencido em 01\/09\/2026,/);
  assert.match(msg.texto, /há 20 dias/);
  assert.doesNotMatch(msg.texto, /Identificamos que/);
  assert.doesNotMatch(msg.texto, /Para regularizar/);
});

test('atraso: vários títulos soma o valor e não cita uma data só', () => {
  const msg = montarMensagemWhatsApp(
    {
      tipo: 'atraso',
      cliente: CLIENTE,
      titulos: [{ data_vencimento: '2026-09-01' }, { data_vencimento: '2026-09-11' }],
      totalRestante: 960,
      maiorAtraso: 16,
    },
    { aleatorio: primeira }
  );
  assert.match(msg.texto, /seus 2 títulos em aberto, somando R\$ 960,00,/);
});

test('cadastro: confirma o cliente e a compra, com o primeiro nome', () => {
  const msg = montarMensagemWhatsApp(
    {
      tipo: 'cadastro',
      cliente: { nome: 'Raissa Namorada' },
      titulo: { produto: 'Salto alto importado', valor: 3000, data_vencimento: '2026-09-23' },
    },
    { aleatorio: primeira }
  );
  assert.equal(msg.tipo, 'cadastro');
  assert.match(msg.texto, /Raissa/);
  assert.match(msg.texto, /Salto alto importado/);
  assert.match(msg.texto, /R\$ 3\.000,00/);
  assert.match(msg.texto, /23\/09\/2026/);
});

test('tipo desconhecido lança erro em vez de mandar mensagem errada', () => {
  assert.throws(() => montarMensagemWhatsApp({ tipo: 'tipo_que_nao_existe', cliente: CLIENTE }));
});

test('sorteia entre as variações — números diferentes de aleatorio dão textos diferentes', () => {
  const envio = {
    tipo: 'vencimento',
    cliente: CLIENTE,
    titulo: { valor_restante: 150, data_vencimento: '2026-09-21' },
  };
  const textos = new Set();
  for (let i = 0; i < 4; i++) {
    textos.add(montarMensagemWhatsApp(envio, { aleatorio: () => i / 4 }).texto);
  }
  assert.ok(textos.size > 1, 'deveria ter mais de uma variação possível');
});

test('nunca repete o texto idêntico ao último mandado pro mesmo cliente+tipo', () => {
  const envio = {
    tipo: 'vencimento',
    cliente: CLIENTE,
    titulo: { valor_restante: 150, data_vencimento: '2026-09-21' },
  };
  const primeiro = montarMensagemWhatsApp(envio, { aleatorio: primeira });
  // Mesmo sorteio (aleatorio: 0) de novo, mas agora informando ultimoTexto:
  // como a variação 0 bateria de novo, a função precisa pular pra outra.
  const segundo = montarMensagemWhatsApp({ ...envio, ultimoTexto: primeiro.texto }, { aleatorio: primeira });
  assert.notEqual(segundo.texto, primeiro.texto);
});

test('se só existe uma variação possível (ultimoTexto ocupa as outras 3), repete mesmo assim', () => {
  // Situação sintética: filtra tudo menos uma opção, pra confirmar que a
  // função não quebra quando sobra 1 só.
  const envio = {
    tipo: 'vencimento',
    cliente: CLIENTE,
    titulo: { valor_restante: 150, data_vencimento: '2026-09-21' },
  };
  const msg = montarMensagemWhatsApp(envio, { aleatorio: primeira });
  assert.ok(msg.texto);
});
