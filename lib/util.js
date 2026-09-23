export const FORMAS_PAGAMENTO = ['PIX', 'Boleto', 'Dinheiro', 'Cartão', 'Cheque', 'A combinar'];

export function formatarMoeda(valor) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Sem centavos — pro número grande de destaque (ex.: termômetro de risco).
export function formatarMoedaCurta(valor) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

export function formatarData(data) {
  if (!data) return '—';
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

// "Quarta-feira, 23 de setembro" — `data` é 'YYYY-MM-DD' (fuso de Brasília,
// como `hojeBrasil()` devolve).
export function formatarDiaSemana(data) {
  const [ano, mes, dia] = data.split('-').map(Number);
  // Meio-dia UTC: nenhum fuso do servidor faz isso "escorregar" pro dia vizinho.
  const instante = new Date(Date.UTC(ano, mes - 1, dia, 12));
  const texto = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(instante);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// "HH:mm" de um instante (timestamptz do banco), no fuso de Brasília.
export function formatarHora(instante) {
  return new Date(instante).toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// "hoje, HH:mm" / "ontem, HH:mm" / "há N dias" — pro feed de mensagens de
// WhatsApp. `instante` é sempre um timestamptz já ocorrido (`criado_em` ou
// `enviado_em`), nunca uma data futura.
export function tempoRelativo(instante) {
  const dias = diasEntre(dataBrasil(instante), hojeBrasil());
  if (dias <= 0) return `hoje, ${formatarHora(instante)}`;
  if (dias === 1) return `ontem, ${formatarHora(instante)}`;
  return `há ${dias} dias`;
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

// Tira acentos, espaços das pontas e maiúsculas: "  José " vira "jose".
export function normalizarTexto(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

// Busca por nome, do jeito que quem digita espera: ignora acento e maiúscula,
// acha pedaço do nome e não liga pra ordem das palavras ("souza maria" acha
// "Maria Aparecida Souza"). Busca vazia acha todo mundo.
export function combinaComBusca(nome, busca) {
  const palavras = normalizarTexto(busca).split(/\s+/).filter(Boolean);
  const nomeNormalizado = normalizarTexto(nome);
  return palavras.every((palavra) => nomeNormalizado.includes(palavra));
}

// A data (YYYY-MM-DD, fuso de Brasília) de um instante, como o timestamptz
// que o banco devolve ("2026-09-21T23:30:00+00:00" ainda é dia 21 aqui).
export function dataBrasil(instante) {
  return new Date(instante).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

// Início do dia (00:00) em Brasília, como instante UTC (ISO) — pra comparar
// com `enviado_em`/`criado_em` do banco ao contar "quantas mensagens hoje".
// Brasília é sempre UTC-3 (sem horário de verão desde 2019).
export function inicioDoDiaBrasil(hoje) {
  return new Date(`${hoje}T00:00:00-03:00`).toISOString();
}

// "Hoje" no fuso do Brasil, no formato YYYY-MM-DD. O banco roda em UTC: depois
// das 21h aqui, o current_date dele já é o dia seguinte — então a data de
// pagamento/venda é enviada explicitamente, em vez de depender do default.
export function hojeBrasil() {
  return dataBrasil(new Date());
}

// Soma (ou subtrai, se negativo) dias a uma data YYYY-MM-DD, sem depender de fuso.
export function somarDias(data, dias) {
  const [ano, mes, dia] = data.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia + dias)).toISOString().slice(0, 10);
}

// Quantos dias se passaram de `de` até `ate` (ambas YYYY-MM-DD).
export function diasEntre(de, ate) {
  const [anoDe, mesDe, diaDe] = de.split('-').map(Number);
  const [anoAte, mesAte, diaAte] = ate.split('-').map(Number);
  const umDia = 24 * 60 * 60 * 1000;
  return Math.round((Date.UTC(anoAte, mesAte - 1, diaAte) - Date.UTC(anoDe, mesDe - 1, diaDe)) / umDia);
}

// "1 título" / "2 títulos": escolhe a forma certa pela quantidade.
export function plural(quantidade, singular, pluralTexto) {
  return quantidade === 1 ? singular : pluralTexto;
}

// Telefone do cliente (ex.: "(11) 91234-5678") no formato que a API do
// WhatsApp exige (E.164, com código do país, só dígitos): "5511912345678".
// Devolve null se não parecer um número de celular/fixo brasileiro válido —
// é assim que os números fictícios de teste, "(00) 00000-00XX", ficam de fora
// sem precisar de um caso especial em quem chama.
export function formatarTelefoneE164(telefone) {
  const digitos = String(telefone ?? '').replace(/\D/g, '');
  const semPais = digitos.startsWith('55') && digitos.length > 11 ? digitos.slice(2) : digitos;
  if (semPais.length !== 10 && semPais.length !== 11) return null;
  const ddd = Number(semPais.slice(0, 2));
  if (ddd < 11 || ddd > 99) return null;
  return `55${semPais}`;
}

// "Rosângela Ferreira" -> "Rosângela" — usado em textos que se dirigem ao
// cliente pelo primeiro nome.
export function primeiroNome(nome) {
  return nome.trim().split(' ')[0] ?? nome;
}

// "Rosângela Ferreira" -> "RF" — iniciais pro avatar. Ignora partículas
// curtas ("de", "da"), a não ser que o nome inteiro já esteja em maiúsculas.
export function iniciais(nome) {
  const partes = nome
    .trim()
    .split(/\s+/)
    .filter((parte) => parte.length > 2 || parte === parte.toUpperCase());
  if (partes.length === 0) return '?';
  const primeira = partes[0][0] ?? '';
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] ?? '' : '';
  return `${primeira}${ultima}`.toUpperCase();
}
