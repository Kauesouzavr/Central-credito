'use server';

import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '../../../lib/supabase-server';
import {
  FORMAS_PAGAMENTO,
  formatarMoeda,
  hojeBrasil,
  lerCampo,
  lerValor,
  paraCentavos,
} from '../../../lib/util';

// Volta pra ficha do cliente, opcionalmente com uma mensagem de sucesso (ok)
// ou de erro (erro) no topo.
function voltarParaFicha(clienteId, tipo, mensagem) {
  const query = mensagem ? `?${tipo}=${encodeURIComponent(mensagem)}` : '';
  redirect(`/clientes/${encodeURIComponent(clienteId)}${query}`);
}

export async function registrarPagamentoParcial(formData) {
  const clienteId = lerCampo(formData, 'cliente_id');
  const tituloId = lerCampo(formData, 'titulo_id');
  const formaPagamento = lerCampo(formData, 'forma_pagamento');
  const valor = lerValor(lerCampo(formData, 'valor'));

  if (valor === null) {
    voltarParaFicha(clienteId, 'erro', 'O valor do pagamento precisa ser maior que zero.');
  }
  if (!FORMAS_PAGAMENTO.includes(formaPagamento)) {
    voltarParaFicha(clienteId, 'erro', 'Forma de pagamento inválida.');
  }

  const supabase = getSupabaseServerClient();

  // O saldo é lido na hora (da view) pra não deixar pagar mais do que falta.
  const { data: titulo, error: erroTitulo } = await supabase
    .from('titulos_com_saldo')
    .select('id, valor_restante')
    .eq('id', tituloId)
    .single();

  if (erroTitulo || !titulo) {
    voltarParaFicha(clienteId, 'erro', 'Título não encontrado.');
  }

  const restante = paraCentavos(titulo.valor_restante);
  if (restante <= 0) {
    voltarParaFicha(clienteId, 'erro', 'Esse título já está pago.');
  }
  if (paraCentavos(valor) > restante) {
    voltarParaFicha(
      clienteId,
      'erro',
      `O valor é maior do que falta pagar (${formatarMoeda(titulo.valor_restante)}).`
    );
  }

  const { error } = await supabase.from('pagamentos').insert({
    titulo_id: tituloId,
    valor,
    forma_pagamento: formaPagamento,
    data_pagamento: hojeBrasil(),
  });

  if (error) {
    voltarParaFicha(clienteId, 'erro', 'Erro ao registrar pagamento: ' + error.message);
  }

  const quitou = paraCentavos(valor) === restante;
  voltarParaFicha(
    clienteId,
    'ok',
    quitou
      ? `Pagamento de ${formatarMoeda(valor)} registrado. Título pago por completo.`
      : `Pagamento de ${formatarMoeda(valor)} registrado.`
  );
}

export async function marcarTituloComoPago(formData) {
  const clienteId = lerCampo(formData, 'cliente_id');
  const tituloId = lerCampo(formData, 'titulo_id');

  const supabase = getSupabaseServerClient();

  const { data: titulo, error: erroTitulo } = await supabase
    .from('titulos_com_saldo')
    .select('id, valor_restante, forma_pagamento')
    .eq('id', tituloId)
    .single();

  if (erroTitulo || !titulo) {
    voltarParaFicha(clienteId, 'erro', 'Título não encontrado.');
  }

  // Já quitado (ex.: clique duplo): não há nada a fazer, a ficha já mostra "Pago".
  if (paraCentavos(titulo.valor_restante) <= 0) {
    voltarParaFicha(clienteId);
  }

  const { error } = await supabase.from('pagamentos').insert({
    titulo_id: tituloId,
    valor: titulo.valor_restante,
    forma_pagamento: titulo.forma_pagamento,
    data_pagamento: hojeBrasil(),
  });

  if (error) {
    voltarParaFicha(clienteId, 'erro', 'Erro ao marcar como pago: ' + error.message);
  }

  voltarParaFicha(clienteId, 'ok', 'Título marcado como pago.');
}

export async function marcarTudoComoPago(formData) {
  const clienteId = lerCampo(formData, 'cliente_id');

  const supabase = getSupabaseServerClient();

  const { data: abertos, error: erroAbertos } = await supabase
    .from('titulos_com_saldo')
    .select('id, valor_restante, forma_pagamento')
    .eq('cliente_id', clienteId)
    .gt('valor_restante', 0);

  if (erroAbertos) {
    voltarParaFicha(clienteId, 'erro', 'Erro ao carregar títulos: ' + erroAbertos.message);
  }

  // Nada em aberto (ex.: clique duplo): a ficha já mostra tudo como pago.
  if (abertos.length === 0) {
    voltarParaFicha(clienteId);
  }

  // Um pagamento por título, no valor exato que falta, tudo num único insert
  // (ou entra tudo, ou não entra nada).
  const dataPagamento = hojeBrasil();
  const { error } = await supabase.from('pagamentos').insert(
    abertos.map((t) => ({
      titulo_id: t.id,
      valor: t.valor_restante,
      forma_pagamento: t.forma_pagamento,
      data_pagamento: dataPagamento,
    }))
  );

  if (error) {
    voltarParaFicha(clienteId, 'erro', 'Erro ao marcar como pago: ' + error.message);
  }

  const totalCentavos = abertos.reduce((soma, t) => soma + paraCentavos(t.valor_restante), 0);
  voltarParaFicha(
    clienteId,
    'ok',
    `Tudo marcado como pago (${abertos.length} ${abertos.length === 1 ? 'título' : 'títulos'}, ${formatarMoeda(totalCentavos / 100)}).`
  );
}
