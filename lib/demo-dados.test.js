import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarDadosDemo } from './demo-dados.js';
import { diasEntre, formatarTelefoneE164 } from './util.js';

const HOJE = '2026-09-21';
const AGORA = new Date('2026-09-21T15:00:00Z');

function gerador() {
  let n = 0;
  return () => `id-${++n}`;
}

function montar(opcoes = {}) {
  return montarDadosDemo(HOJE, { agora: AGORA, gerarId: gerador(), ...opcoes });
}

test('todo cliente é "TESTE" com telefone inválido e diferente dos outros', () => {
  const { clientes } = montar();
  assert.ok(clientes.length >= 18);
  const telefones = new Set();
  for (const c of clientes) {
    assert.equal(c.cidade, 'TESTE', c.nome);
    assert.match(c.telefone, /^\(00\) 00000-00\d\d$/, c.nome);
    assert.equal(formatarTelefoneE164(c.telefone), null, c.nome);
    telefones.add(c.telefone);
  }
  assert.equal(telefones.size, clientes.length);
});

test('nenhum valor de título ou pagamento é menor ou igual a zero', () => {
  const { titulos, pagamentos } = montar();
  for (const t of titulos) assert.ok(t.valor > 0, t.produto);
  for (const p of pagamentos) assert.ok(p.valor > 0);
});

test('pagamentos nunca somam mais que o valor do título e não são anteriores à venda', () => {
  const { titulos, pagamentos } = montar();
  const tituloPorId = new Map(titulos.map((t) => [t.id, t]));
  const somaPorTitulo = new Map();
  for (const p of pagamentos) {
    const t = tituloPorId.get(p.titulo_id);
    assert.ok(t, 'pagamento aponta pra título que existe');
    assert.ok(p.data_pagamento >= t.data_venda, `${t.produto}: pagamento antes da venda`);
    somaPorTitulo.set(p.titulo_id, (somaPorTitulo.get(p.titulo_id) ?? 0) + p.valor);
  }
  for (const [id, soma] of somaPorTitulo) {
    assert.ok(soma <= tituloPorId.get(id).valor + 1e-9, `título ${id} pago a mais`);
  }
});

test('a demo varia as situações: atrasados, a vencer, quitados e pagamento parcial', () => {
  const { titulos, pagamentos } = montar();
  const pago = new Map();
  for (const p of pagamentos) pago.set(p.titulo_id, (pago.get(p.titulo_id) ?? 0) + p.valor);

  const restante = (t) => t.valor - (pago.get(t.id) ?? 0);
  const abertos = titulos.filter((t) => restante(t) > 0);

  assert.ok(abertos.some((t) => t.data_vencimento < HOJE), 'tem atrasado');
  assert.ok(abertos.some((t) => t.data_vencimento === HOJE), 'tem vencendo hoje');
  assert.ok(abertos.some((t) => t.data_vencimento > HOJE), 'tem a vencer');
  assert.ok(titulos.some((t) => restante(t) <= 0), 'tem quitado');
  assert.ok(abertos.some((t) => (pago.get(t.id) ?? 0) > 0), 'tem pagamento parcial');
});

test('as datas são relativas a hoje: mudar o dia desloca tudo igual', () => {
  const a = montarDadosDemo('2026-01-10', { agora: AGORA, gerarId: gerador() });
  const b = montarDadosDemo('2027-03-05', { agora: AGORA, gerarId: gerador() });
  assert.equal(a.titulos.length, b.titulos.length);
  a.titulos.forEach((t, i) => {
    assert.equal(diasEntre('2026-01-10', t.data_vencimento), diasEntre('2027-03-05', b.titulos[i].data_vencimento));
    assert.equal(diasEntre('2026-01-10', t.data_venda), diasEntre('2027-03-05', b.titulos[i].data_venda));
  });
});

test('monta cerca de 10 mensagens válidas, com 2 ou 3 esperando revisão', () => {
  const { clientes, titulos, mensagens } = montar();
  assert.ok(mensagens.length >= 8 && mensagens.length <= 12, `mensagens: ${mensagens.length}`);

  const tiposValidos = ['cadastro', 'antes_vencimento', 'vencimento', 'atraso'];
  const clientePorId = new Map(clientes.map((c) => [c.id, c]));
  const tituloPorId = new Map(titulos.map((t) => [t.id, t]));

  for (const m of mensagens) {
    assert.ok(tiposValidos.includes(m.tipo), m.tipo);
    assert.ok(['enviada', 'pendente_revisao'].includes(m.status), m.status);
    assert.ok(m.texto && m.texto.length > 10, 'texto obrigatório');
    assert.ok(clientePorId.has(m.cliente_id));
    if (m.titulo_id) assert.equal(tituloPorId.get(m.titulo_id).cliente_id, m.cliente_id);
    if (m.status === 'enviada') {
      assert.ok(m.enviado_em, 'enviada tem enviado_em');
      assert.ok(new Date(m.enviado_em) <= AGORA, 'enviada não é do futuro');
    } else {
      assert.equal(m.enviado_em, null);
    }
  }

  const pendentes = mensagens.filter((m) => m.status === 'pendente_revisao').length;
  assert.ok(pendentes >= 2 && pendentes <= 3, `pendentes: ${pendentes}`);
});

test('o texto das mensagens cita o nome do cliente (variação previsível)', () => {
  const { clientes, mensagens } = montar();
  const nomePorId = new Map(clientes.map((c) => [c.id, c.nome]));
  for (const m of mensagens) {
    assert.ok(m.texto.includes(nomePorId.get(m.cliente_id).split(' ')[0]), m.texto);
  }
  assert.deepEqual(
    montar().mensagens.map((m) => m.texto),
    montar().mensagens.map((m) => m.texto)
  );
});

test('modo do seed de teste: só os 10 clientes originais e nenhuma mensagem', () => {
  const { clientes, mensagens } = montar({ incluirExtras: false, incluirMensagens: false });
  assert.equal(clientes.length, 10);
  assert.equal(clientes[0].nome, 'Maria Aparecida Souza');
  assert.equal(clientes[0].telefone, '(00) 00000-0001');
  assert.equal(clientes[9].telefone, '(00) 00000-0010');
  assert.equal(mensagens.length, 0);
});
