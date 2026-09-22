// Fase 6: texto das mensagens de WhatsApp. Função pura, testável sem
// conectar no WhatsApp de verdade. Usada em dois lugares:
//   - por um envio decidido por lib/regua.js (antes_vencimento, vencimento,
//     atraso), dentro do bot (scripts/whatsapp-bot.mjs);
//   - no cadastro de cliente novo (app/clientes/novo/actions.js), que monta
//     o texto de 'cadastro' na hora e grava já pronto em `mensagens`.
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

// titulo aqui é o registro cru de `titulos` (não a view titulos_com_saldo):
// no cadastro, o título acabou de ser criado, então valor === valor_restante.
function cadastro(envio) {
  const nome = primeiroNome(envio.cliente.nome);
  const valor = formatarMoeda(envio.titulo.valor);
  const data = formatarData(envio.titulo.data_vencimento);
  return `Olá, ${nome}! Seu cadastro foi feito com sucesso. Registramos a compra: ${envio.titulo.produto}, ${valor}, vencimento em ${data}. Qualquer dúvida, é só chamar por aqui!`;
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
  cadastro,
};

// envio: um item devolvido por montarRegua (lib/regua.js), ou montado à mão
// pra 'cadastro' — { tipo: 'cadastro', cliente: { nome }, titulo: { produto,
// valor, data_vencimento } }.
// Devolve { tipo, texto } — ou lança erro se o tipo não for um dos que essa
// fase manda.
export function montarMensagemWhatsApp(envio) {
  const montar = MONTAR_POR_TIPO[envio.tipo];
  if (!montar) throw new Error(`Tipo de mensagem desconhecido: ${envio.tipo}`);
  return { tipo: envio.tipo, texto: montar(envio) };
}
