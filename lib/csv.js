import { formatarData } from './util.js';

const CABECALHO = [
  'Cliente',
  'Telefone',
  'Bairro/cidade',
  'Produto',
  'Valor',
  'Pago',
  'Restante',
  'Venda',
  'Vencimento',
  'Forma de pagamento',
  'Status',
];

const ROTULO_STATUS = { pago: 'Pago', atrasado: 'Atrasado', em_aberto: 'Em aberto' };

function celula(valor) {
  const texto = String(valor ?? '');
  return /[;"\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

function moeda(valor) {
  return Number(valor).toFixed(2).replace('.', ',');
}

// Uma linha por título (não por cliente) — assim dá pra ver todas as
// compras, abertas e quitadas, sem perder detalhe. `;` como separador e
// `﻿` no início porque é assim que o Excel em português abre um CSV
// com acento sem embaralhar.
export function gerarCsvClientes(clientes, titulos) {
  const clientePorId = new Map(clientes.map((c) => [c.id, c]));
  const linhas = [CABECALHO.map(celula).join(';')];

  for (const t of titulos) {
    const cliente = clientePorId.get(t.cliente_id);
    if (!cliente) continue;
    linhas.push(
      [
        cliente.nome,
        cliente.telefone,
        cliente.segmento || '',
        t.produto,
        moeda(t.valor),
        moeda(t.valor_pago),
        moeda(t.valor_restante),
        formatarData(t.data_venda),
        formatarData(t.data_vencimento),
        t.forma_pagamento,
        ROTULO_STATUS[t.status] || t.status,
      ]
        .map(celula)
        .join(';')
    );
  }

  return `﻿${linhas.join('\r\n')}\r\n`;
}
