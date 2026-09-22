// Fase 6: texto das mensagens de WhatsApp, a partir de um envio decidido por
// lib/regua.js. Função pura, testável sem chamar a API de verdade.
//
// A Cloud API da Meta só deixa mandar TEXTO LIVRE pra quem mandou mensagem
// pra gente nas últimas 24h. Como cobrança é a loja iniciando a conversa,
// toda mensagem daqui vira um "template" pré-aprovado, com variáveis
// {{1}}, {{2}}... — por isso cada mensagem tem `parametros` (o que entra em
// cada variável, na ordem) além do `texto` já resolvido (guardado em
// mensagens.texto, pra auditoria e pra tela mostrar o que foi mandado).
//
// Nome do template na Meta -> nome aqui:
//   aviso_vencimento -> antesVencimento
//   vencimento_hoje  -> vencimento
//   cobranca_atraso  -> atraso

import { formatarData, formatarMoeda, plural } from './util.js';

function primeiroNome(nomeCompleto) {
  return String(nomeCompleto).trim().split(/\s+/)[0];
}

// aviso_vencimento: "Olá, {{1}}! Passando para lembrar que seu título de
// {{2}} vence em {{3}} dias, no dia {{4}}."
function antesVencimento(envio) {
  const parametros = [
    primeiroNome(envio.cliente.nome),
    formatarMoeda(envio.titulo.valor_restante),
    String(envio.dias),
    formatarData(envio.titulo.data_vencimento),
  ];
  return {
    template: 'aviso_vencimento',
    parametros,
    texto: `Olá, ${parametros[0]}! Passando para lembrar que seu título de ${parametros[1]} vence em ${envio.dias} ${plural(envio.dias, 'dia', 'dias')}, no dia ${parametros[3]}.`,
  };
}

// vencimento_hoje: "Olá, {{1}}! Seu título de {{2}} vence hoje ({{3}})."
function vencimento(envio) {
  const parametros = [
    primeiroNome(envio.cliente.nome),
    formatarMoeda(envio.titulo.valor_restante),
    formatarData(envio.titulo.data_vencimento),
  ];
  return {
    template: 'vencimento_hoje',
    parametros,
    texto: `Olá, ${parametros[0]}! Seu título de ${parametros[1]} vence hoje (${parametros[2]}).`,
  };
}

// cobranca_atraso: "Olá, {{1}}! Identificamos que {{2}} está em aberto há
// {{3}} dias. Para regularizar, é só chamar por aqui."
function atraso(envio) {
  const qtd = envio.titulos.length;
  const referencia =
    qtd === 1
      ? `seu título de ${formatarMoeda(envio.totalRestante)}, vencido em ${formatarData(envio.titulos[0].data_vencimento)},`
      : `seus ${qtd} títulos em aberto, somando ${formatarMoeda(envio.totalRestante)},`;
  const parametros = [primeiroNome(envio.cliente.nome), referencia, String(envio.maiorAtraso)];
  return {
    template: 'cobranca_atraso',
    parametros,
    texto: `Olá, ${parametros[0]}! Identificamos que ${referencia} está em aberto há ${envio.maiorAtraso} ${plural(envio.maiorAtraso, 'dia', 'dias')}. Para regularizar, é só chamar por aqui.`,
  };
}

const MONTAR_POR_TIPO = {
  antes_vencimento: antesVencimento,
  vencimento,
  atraso,
};

// envio: um item devolvido por montarRegua (lib/regua.js).
// Devolve { template, parametros, texto } — ou lança erro se o tipo não for
// um dos três que essa fase manda.
export function montarMensagemWhatsApp(envio) {
  const montar = MONTAR_POR_TIPO[envio.tipo];
  if (!montar) throw new Error(`Tipo de mensagem desconhecido: ${envio.tipo}`);
  return montar(envio);
}
