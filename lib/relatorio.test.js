import { test } from 'node:test';
import assert from 'node:assert/strict';
import { montarRelatorio } from './relatorio.js';

const HOJE = '2026-09-22'; // semana atual: 16/09 a 22/09; anterior: 09/09 a 15/09

function base(overrides = {}) {
  return { titulos: [], pagamentos: [], clientes: [], mensagens: [], hoje: HOJE, ...overrides };
}

test('semana atual e anterior têm 7 dias cada, sem sobrepor', () => {
  const r = montarRelatorio(base());
  assert.deepEqual(r.semanaAtual, { inicio: '2026-09-16', fim: '2026-09-22' });
  assert.deepEqual(r.semanaAnterior, { inicio: '2026-09-09', fim: '2026-09-15' });
});

test('vendido soma só os títulos com data_venda dentro da semana', () => {
  const r = montarRelatorio(
    base({
      titulos: [
        { valor: 100, data_venda: '2026-09-16', data_vencimento: '2026-10-01', status: 'em_aberto' }, // início da semana
        { valor: 50, data_venda: '2026-09-22', data_vencimento: '2026-10-01', status: 'em_aberto' }, // hoje
        { valor: 999, data_venda: '2026-09-08', data_vencimento: '2026-10-01', status: 'em_aberto' }, // antes da semana anterior, fora das duas
        { valor: 30, data_venda: '2026-09-10', data_vencimento: '2026-10-01', status: 'em_aberto' }, // semana anterior
      ],
    })
  );
  assert.equal(r.atual.vendido, 150);
  assert.equal(r.atual.titulosVendidos, 2);
  assert.equal(r.anterior.vendido, 30);
});

test('recebido soma os pagamentos por data_pagamento, não pela data do título', () => {
  const r = montarRelatorio(
    base({
      pagamentos: [
        { valor: 40, data_pagamento: '2026-09-18' },
        { valor: 60, data_pagamento: '2026-09-14' }, // semana anterior
      ],
    })
  );
  assert.equal(r.atual.recebido, 40);
  assert.equal(r.atual.pagamentosCount, 1);
  assert.equal(r.anterior.recebido, 60);
});

test('clientes novos conta pela data de cadastro', () => {
  const r = montarRelatorio(
    base({
      clientes: [{ data_cadastro: '2026-09-20' }, { data_cadastro: '2026-08-01' }],
    })
  );
  assert.equal(r.atual.clientesNovos, 1);
  assert.equal(r.anterior.clientesNovos, 0);
});

test('novos atrasos: só título atrasado, com vencimento dentro da semana', () => {
  const r = montarRelatorio(
    base({
      titulos: [
        { valor: 100, data_venda: '2026-08-01', data_vencimento: '2026-09-18', status: 'atrasado' }, // conta
        { valor: 200, data_venda: '2026-08-01', data_vencimento: '2026-09-18', status: 'pago' }, // venceu na semana, mas já foi pago
        { valor: 300, data_venda: '2026-08-01', data_vencimento: '2026-09-01', status: 'atrasado' }, // atrasado, mas venceu antes da semana
      ],
    })
  );
  assert.equal(r.atual.novosAtrasos, 1);
});

test('mensagens: só conta status "enviada", por tipo, dentro do período', () => {
  const r = montarRelatorio(
    base({
      mensagens: [
        { tipo: 'atraso', status: 'enviada', data_envio: '2026-09-19' },
        { tipo: 'atraso', status: 'enviada', data_envio: '2026-09-19' },
        { tipo: 'cadastro', status: 'enviada', data_envio: '2026-09-20' },
        { tipo: 'atraso', status: 'pendente', data_envio: null }, // não conta
        { tipo: 'atraso', status: 'erro', data_envio: null }, // não conta
        { tipo: 'vencimento', status: 'enviada', data_envio: '2026-09-10' }, // semana anterior
      ],
    })
  );
  assert.equal(r.atual.mensagensEnviadas, 3);
  assert.equal(r.atual.mensagensPorTipo.atraso, 2);
  assert.equal(r.atual.mensagensPorTipo.cadastro, 1);
  assert.equal(r.atual.mensagensPorTipo.vencimento, 0);
  assert.equal(r.anterior.mensagensPorTipo.vencimento, 1);
});

test('variação: sobe, desce, sem mudança e sem base de comparação', () => {
  const r = montarRelatorio(
    base({
      pagamentos: [
        { valor: 150, data_pagamento: '2026-09-18' }, // semana atual: 150
        { valor: 100, data_pagamento: '2026-09-11' }, // semana anterior: 100
      ],
    })
  );
  assert.equal(r.variacao.recebido, 50); // +50%

  const semMudanca = montarRelatorio(
    base({
      pagamentos: [
        { valor: 100, data_pagamento: '2026-09-18' },
        { valor: 100, data_pagamento: '2026-09-11' },
      ],
    })
  );
  assert.equal(semMudanca.variacao.recebido, 0);

  const semBase = montarRelatorio(base({ pagamentos: [{ valor: 100, data_pagamento: '2026-09-18' }] }));
  assert.equal(semBase.variacao.recebido, null); // anterior zerado, atual não

  const tudoZerado = montarRelatorio(base());
  assert.equal(tudoZerado.variacao.recebido, 0); // as duas semanas zeradas
});
