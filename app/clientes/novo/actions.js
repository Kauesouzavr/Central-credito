'use server';

import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '../../../lib/supabase-server';
import { FORMAS_PAGAMENTO, formatarTelefoneE164, hojeBrasil } from '../../../lib/util';
import { montarMensagemWhatsApp } from '../../../lib/mensagens-whatsapp';

export async function criarCliente(formData) {
  const nome = (formData.get('nome') || '').toString().trim();
  const telefone = (formData.get('telefone') || '').toString().trim();
  const telefoneReserva = (formData.get('telefone_reserva') || '').toString().trim();
  const segmento = (formData.get('segmento') || '').toString().trim();

  const produto = (formData.get('produto') || '').toString().trim();
  const valorTexto = (formData.get('valor') || '').toString().trim();
  const dataVencimento = (formData.get('data_vencimento') || '').toString().trim();
  const formaPagamento = (formData.get('forma_pagamento') || '').toString().trim();

  const erros = [];
  if (!nome) erros.push('Nome é obrigatório');
  if (!telefone) erros.push('Telefone é obrigatório');
  if (!produto) erros.push('Produto é obrigatório');

  const valor = Number(valorTexto.replace(',', '.'));
  if (!valorTexto || Number.isNaN(valor) || valor <= 0) {
    erros.push('Valor precisa ser um número maior que zero');
  }
  if (!dataVencimento) erros.push('Data de vencimento é obrigatória');
  if (!FORMAS_PAGAMENTO.includes(formaPagamento)) erros.push('Forma de pagamento inválida');

  if (erros.length > 0) {
    redirect(`/clientes?novo=1&erro=${encodeURIComponent(erros.join('; '))}`);
    return;
  }

  const supabase = getSupabaseServerClient();

  const { data: cliente, error: erroCliente } = await supabase
    .from('clientes')
    .insert({
      nome,
      telefone,
      telefone_reserva: telefoneReserva || null,
      segmento: segmento || null,
    })
    .select()
    .single();

  if (erroCliente) {
    redirect(
      `/clientes?novo=1&erro=${encodeURIComponent('Erro ao salvar cliente: ' + erroCliente.message)}`
    );
    return;
  }

  const { data: titulo, error: erroTitulo } = await supabase
    .from('titulos')
    .insert({
      cliente_id: cliente.id,
      produto,
      valor,
      data_venda: hojeBrasil(),
      data_vencimento: dataVencimento,
      forma_pagamento: formaPagamento,
    })
    .select('id, produto, valor, data_vencimento')
    .single();

  if (erroTitulo) {
    redirect(
      `/clientes/${cliente.id}?erro=${encodeURIComponent(
        'Cliente salvo, mas houve erro ao salvar a compra: ' + erroTitulo.message
      )}`
    );
    return;
  }

  // Mensagem de boas-vindas por WhatsApp (Fase 6): só grava 'pendente' aqui —
  // quem manda de verdade é o bot (scripts/whatsapp-bot.mjs), no próximo
  // ciclo dele. Não bloqueia o cadastro se der erro (ou se o telefone não
  // parecer válido pra WhatsApp): cliente e compra já estão salvos, o aviso
  // é só um extra.
  if (formatarTelefoneE164(telefone)) {
    const { texto } = montarMensagemWhatsApp({ tipo: 'cadastro', cliente: { nome }, titulo });
    const { error: erroMensagem } = await supabase
      .from('mensagens')
      .insert({ cliente_id: cliente.id, titulo_id: titulo.id, tipo: 'cadastro', texto, status: 'pendente' });
    if (erroMensagem) {
      console.error('Erro ao enfileirar mensagem de cadastro:', erroMensagem.message);
    }
  }

  redirect(`/clientes/${cliente.id}?ok=${encodeURIComponent('Cliente cadastrado. A mensagem de boas-vindas foi enviada no WhatsApp.')}`);
}
