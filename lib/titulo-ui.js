import { diasEntre, plural } from './util.js';

// O schema só tem 3 status ('pago' | 'atrasado' | 'em_aberto') — "vence hoje"
// e "a vencer" são as duas leituras visuais de 'em_aberto', decididas aqui
// comparando com a data de hoje (que quem chama já sabe, em fuso de Brasília).
export function estiloStatusTitulo(titulo, hoje) {
  if (titulo.status === 'pago') return 'bg-ok-50 text-ok-700 ring-ok-500/20';
  if (titulo.status === 'atrasado') return 'bg-brand-50 text-brand-700 ring-brand-200';
  if (titulo.data_vencimento === hoje) return 'bg-warn-100 text-warn-700 ring-warn-500/25';
  return 'bg-white text-ink-soft ring-line';
}

export function descreverVencimento(titulo, hoje) {
  if (titulo.status === 'pago') return 'Quitado';
  if (titulo.status === 'atrasado') {
    const dias = Number(titulo.dias_atraso);
    return `${dias} ${plural(dias, 'dia', 'dias')} atrasado`;
  }
  if (titulo.data_vencimento === hoje) return 'Vence hoje';
  const dias = diasEntre(hoje, titulo.data_vencimento);
  return dias === 1 ? 'Vence amanhã' : `Vence em ${dias} dias`;
}
