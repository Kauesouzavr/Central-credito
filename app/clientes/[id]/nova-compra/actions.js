'use server';

import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '../../../../lib/supabase-server';
import {
  FORMAS_PAGAMENTO,
  formatarMoeda,
  hojeBrasil,
  lerCampo,
  lerValor,
} from '../../../../lib/util';

export async function adicionarCompra(formData) {
  const clienteId = lerCampo(formData, 'cliente_id');
  const produto = lerCampo(formData, 'produto');
  const dataVencimento = lerCampo(formData, 'data_vencimento');
  const formaPagamento = lerCampo(formData, 'forma_pagamento');
  const valor = lerValor(lerCampo(formData, 'valor'));

  const erros = [];
  if (!produto) erros.push('Produto é obrigatório');
  if (valor === null) erros.push('Valor precisa ser um número maior que zero');
  if (!dataVencimento) erros.push('Data de vencimento é obrigatória');
  if (!FORMAS_PAGAMENTO.includes(formaPagamento)) erros.push('Forma de pagamento inválida');

  const base = `/clientes/${encodeURIComponent(clienteId)}`;

  if (erros.length > 0) {
    redirect(`${base}/nova-compra?erro=${encodeURIComponent(erros.join('; '))}`);
  }

  const supabase = getSupabaseServerClient();

  const { error } = await supabase.from('titulos').insert({
    cliente_id: clienteId,
    produto,
    valor,
    data_venda: hojeBrasil(),
    data_vencimento: dataVencimento,
    forma_pagamento: formaPagamento,
  });

  if (error) {
    redirect(
      `${base}/nova-compra?erro=${encodeURIComponent('Erro ao salvar a compra: ' + error.message)}`
    );
  }

  redirect(`${base}?ok=${encodeURIComponent(`Compra de ${formatarMoeda(valor)} adicionada.`)}`);
}
