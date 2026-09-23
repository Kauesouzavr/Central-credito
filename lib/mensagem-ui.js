// Rótulos em português dos campos de `mensagens` (schema: tipo/status) —
// usados no feed de WhatsApp da ficha do cliente e da tela de Cobrança.

export const ROTULO_TIPO_MENSAGEM = {
  cadastro: 'Boas-vindas',
  nova_compra: 'Nova compra',
  antes_vencimento: 'Lembrete',
  vencimento: 'Vencimento',
  atraso: 'Cobrança',
  pagamento_parcial: 'Confirmação de pagamento',
};

export const ROTULO_STATUS_MENSAGEM = {
  pendente: 'agendada',
  enviada: 'enviada',
  erro: 'não enviada',
};

// Instante pra ordenar/formatar: `enviado_em` quando já saiu, senão
// `criado_em` (mensagem ainda na fila).
export function instanteMensagem(mensagem) {
  return mensagem.enviado_em || mensagem.criado_em;
}
