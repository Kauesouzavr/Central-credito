export const FORMAS_PAGAMENTO = ['PIX', 'Boleto', 'Dinheiro', 'Cartão', 'Cheque', 'A combinar'];

export function formatarMoeda(valor) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatarData(data) {
  if (!data) return '—';
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

// Lê um campo de texto do formulário, já sem espaços nas pontas.
export function lerCampo(formData, nome) {
  return (formData.get(nome) || '').toString().trim();
}

// Lê "12,50" ou "12.50" e devolve o número com 2 casas, ou null se não for
// um valor válido maior que zero.
export function lerValor(texto) {
  const valor = Number(String(texto).trim().replace(',', '.'));
  if (!Number.isFinite(valor) || valor <= 0) return null;
  return Math.round(valor * 100) / 100;
}

// Compara/soma dinheiro em centavos (inteiros) pra não cair em erro de
// ponto flutuante.
export function paraCentavos(valor) {
  return Math.round(Number(valor) * 100);
}

// "Hoje" no fuso do Brasil, no formato YYYY-MM-DD. O banco roda em UTC: depois
// das 21h aqui, o current_date dele já é o dia seguinte — então a data de
// pagamento/venda é enviada explicitamente, em vez de depender do default.
export function hojeBrasil() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}
