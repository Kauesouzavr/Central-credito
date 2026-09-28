'use server';

import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '../../../lib/supabase-server';
import { FORMAS_PAGAMENTO, formatarTelefoneE164, hojeBrasil, lerCampo, lerValor } from '../../../lib/util';
import { montarMensagemWhatsApp } from '../../../lib/mensagens-whatsapp';

function soDigitos(telefone) {
  return String(telefone ?? '').replace(/\D/g, '');
}

export async function criarCliente(formData) {
  const nome = lerCampo(formData, 'nome');
  const telefone = lerCampo(formData, 'telefone');
  const telefoneReserva = lerCampo(formData, 'telefone_reserva');
  const cep = lerCampo(formData, 'cep');
  const bairro = lerCampo(formData, 'bairro');
  const cidade = lerCampo(formData, 'cidade');
  const endereco = lerCampo(formData, 'endereco');
  const numero = lerCampo(formData, 'numero');

  const produto = lerCampo(formData, 'produto');
  const valor = lerValor(lerCampo(formData, 'valor'));
  const dataVencimento = lerCampo(formData, 'data_vencimento');
  const formaPagamento = lerCampo(formData, 'forma_pagamento');

  const erros = [];
  if (!nome) erros.push('Nome é obrigatório');
  if (!telefone) erros.push('Telefone é obrigatório');
  if (!produto) erros.push('Produto é obrigatório');
  if (valor === null) erros.push('Valor precisa ser um número maior que zero');
  if (!dataVencimento) erros.push('Data de vencimento é obrigatória');
  if (!FORMAS_PAGAMENTO.includes(formaPagamento)) erros.push('Forma de pagamento inválida');

  if (erros.length > 0) {
    redirect(`/clientes?novo=1&erro=${encodeURIComponent(erros.join('; '))}`);
    return;
  }

  const supabase = getSupabaseServerClient();

  const digitosTelefone = soDigitos(telefone);
  const { data: existentes, error: erroBusca } = await supabase
    .from('clientes')
    .select('id, nome, telefone, telefone_reserva');
  if (erroBusca) {
    redirect(`/clientes?novo=1&erro=${encodeURIComponent('Erro ao conferir telefone: ' + erroBusca.message)}`);
    return;
  }
  const duplicado = existentes.find(
    (c) => soDigitos(c.telefone) === digitosTelefone || soDigitos(c.telefone_reserva) === digitosTelefone
  );
  if (duplicado) {
    redirect(
      `/clientes?novo=1&erro=${encodeURIComponent(`Já existe um cliente com esse telefone: ${duplicado.nome}.`)}`
    );
    return;
  }

  const { data: cliente, error: erroCliente } = await supabase
    .from('clientes')
    .insert({
      nome,
      telefone,
      telefone_reserva: telefoneReserva || null,
      cep: cep || null,
      bairro: bairro || null,
      cidade: cidade || null,
      endereco: endereco || null,
      numero: numero || null,
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
