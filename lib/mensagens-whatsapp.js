// Fase 6: texto das mensagens de WhatsApp, a partir de um envio decidido por
// lib/regua.js. Função pura, testável sem conectar no WhatsApp de verdade.
//
// Envio é por Baileys (biblioteca não-oficial, conexão por QR code), que manda
// texto livre — sem template pré-aprovado, ao contrário da Cloud API oficial
// da Meta (decisão registrada no CLAUDE.md).

import { formatarData, formatarMoeda, plural } from './util.js';

function primeiroNome(nomeCompleto) {
  return String(nomeCompleto).trim().split(/\s+/)[0];
}

function antesVencimento(envio) {
  const nome = primeiroNome(envio.cliente.nome);
  const valor = formatarMoeda(envio.titulo.valor_restante);
  const data = formatarData(envio.titulo.data_vencimento);
  return `Olá, ${nome}! Passando para lembrar que seu título de ${valor} vence em ${envio.dias} ${plural(envio.dias, 'dia', 'dias')}, no dia ${data}.`;
}

function vencimento(envio) {
  const nome = primeiroNome(envio.cliente.nome);
  const valor = formatarMoeda(envio.titulo.valor_restante);
  const data = formatarData(envio.titulo.data_vencimento);
  return `Olá, ${nome}! Seu título de ${valor} vence hoje (${data}).`;
}

function atraso(envio) {
  const nome = primeiroNome(envio.cliente.nome);
  const qtd = envio.titulos.length;
  const referencia =
    qtd === 1
      ? `seu título de ${formatarMoeda(envio.totalRestante)}, vencido em ${formatarData(envio.titulos[0].data_vencimento)},`
      : `seus ${qtd} títulos em aberto, somando ${formatarMoeda(envio.totalRestante)},`;
  return `Olá, ${nome}! Identificamos que ${referencia} está em aberto há ${envio.maiorAtraso} ${plural(envio.maiorAtraso, 'dia', 'dias')}. Para regularizar, é só chamar por aqui.`;
}

const MONTAR_POR_TIPO = {
  antes_vencimento: antesVencimento,
  vencimento,
  atraso,
};

// envio: um item devolvido por montarRegua (lib/regua.js).
// Devolve { tipo, texto } — ou lança erro se o tipo não for um dos três que
// essa fase manda.
export function montarMensagemWhatsApp(envio) {
  const montar = MONTAR_POR_TIPO[envio.tipo];
  if (!montar) throw new Error(`Tipo de mensagem desconhecido: ${envio.tipo}`);
  return { tipo: envio.tipo, texto: montar(envio) };
}
