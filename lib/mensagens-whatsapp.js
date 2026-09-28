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
//
// Fase 9: cada tipo tem várias variações de frase, num tom casual (como se
// alguém tivesse digitado rápido), pra não soar repetitivo/robótico. Nunca
// repete o texto idêntico do envio anterior pro mesmo cliente+tipo — quem
// chama passa `envio.ultimoTexto` com o texto da última mensagem desse tipo
// pra esse cliente, se houver.

import { formatarData, formatarMoeda, plural } from './util.js';

function primeiroNome(nomeCompleto) {
  return String(nomeCompleto).trim().split(/\s+/)[0];
}

function antesVencimento(envio) {
  const nome = primeiroNome(envio.cliente.nome);
  const valor = formatarMoeda(envio.titulo.valor_restante);
  const data = formatarData(envio.titulo.data_vencimento);
  const dias = envio.dias;
  const diaPlural = plural(dias, 'dia', 'dias');
  return [
    `Oi, ${nome}! Passando pra lembrar que seu título de ${valor} vence em ${dias} ${diaPlural}, no dia ${data}.`,
    `${nome}, um toque rapidinho: seu pagamento de ${valor} vence em ${dias} ${diaPlural}, no dia ${data}.`,
    `Oi ${nome}, lembrete por aqui: ${valor} vence dia ${data} (${dias} ${diaPlural}).`,
    `${nome}, só passando pra avisar: falta${dias === 1 ? '' : 'm'} ${dias} ${diaPlural} pro vencimento de ${valor}, em ${data}.`,
  ];
}

function vencimento(envio) {
  const nome = primeiroNome(envio.cliente.nome);
  const valor = formatarMoeda(envio.titulo.valor_restante);
  const data = formatarData(envio.titulo.data_vencimento);
  return [
    `Oi, ${nome}! Seu título de ${valor} vence hoje (${data}).`,
    `${nome}, hoje é o dia! ${valor} vence agora, ${data}.`,
    `Oi ${nome}, só lembrando: vence hoje o valor de ${valor} (${data}).`,
    `${nome}, chegou o dia do vencimento: ${valor}, hoje (${data}).`,
  ];
}

// titulo aqui é o registro cru de `titulos` (não a view titulos_com_saldo):
// no cadastro, o título acabou de ser criado, então valor === valor_restante.
function cadastro(envio) {
  const nome = primeiroNome(envio.cliente.nome);
  const valor = formatarMoeda(envio.titulo.valor);
  const data = formatarData(envio.titulo.data_vencimento);
  return [
    `Oi, ${nome}! Seu cadastro está pronto. Anotei a compra: ${envio.titulo.produto}, ${valor}, vence dia ${data}. Qualquer coisa é só chamar por aqui!`,
    `${nome}, tudo certo! Cadastro feito e já registrei: ${envio.titulo.produto} por ${valor}, vencimento em ${data}. Fico à disposição por aqui.`,
    `Prontinho, ${nome}! Ficou registrado: ${envio.titulo.produto}, ${valor}, vencendo em ${data}. Qualquer dúvida, me chama.`,
    `Oi ${nome}! Cadastro concluído. Compra anotada: ${envio.titulo.produto}, ${valor}, vence dia ${data}. Qualquer coisa é só falar comigo por aqui.`,
  ];
}

function referenciaAtraso(envio) {
  const qtd = envio.titulos.length;
  return qtd === 1
    ? `seu título de ${formatarMoeda(envio.totalRestante)}, vencido em ${formatarData(envio.titulos[0].data_vencimento)},`
    : `seus ${qtd} títulos em aberto, somando ${formatarMoeda(envio.totalRestante)},`;
}

function atraso(envio) {
  const nome = primeiroNome(envio.cliente.nome);
  const referencia = referenciaAtraso(envio);
  const dias = envio.maiorAtraso;
  const diaPlural = plural(dias, 'dia', 'dias');
  return [
    `Oi, ${nome}! ${referencia} está em aberto há ${dias} ${diaPlural}. Dá uma olhada quando puder?`,
    `${nome}, tudo bem? ${referencia} segue em aberto, já ${dias} ${diaPlural}. Bora resolver isso?`,
    `Oi ${nome}, passando aqui: ${referencia} está pendente há ${dias} ${diaPlural}. Se puder dar um retorno, agradeço!`,
    `${nome}, ${referencia} ainda tá em aberto (${dias} ${diaPlural}). Qualquer coisa é só chamar por aqui pra acertar.`,
  ];
}

const VARIACOES_POR_TIPO = {
  antes_vencimento: antesVencimento,
  vencimento,
  atraso,
  cadastro,
};

// Sorteia entre as variações do tipo, evitando repetir o texto igual ao
// último mandado (envio.ultimoTexto) quando existe mais de uma opção
// disponível. `aleatorio` (0 a 1) é injetável pra manter a função testável.
function escolherVariacao(variacoes, ultimoTexto, aleatorio) {
  const disponiveis = ultimoTexto ? variacoes.filter((texto) => texto !== ultimoTexto) : variacoes;
  const lista = disponiveis.length > 0 ? disponiveis : variacoes;
  const indice = Math.min(lista.length - 1, Math.floor(aleatorio() * lista.length));
  return lista[indice];
}

// envio: um item devolvido por montarRegua (lib/regua.js), ou montado à mão
// pra 'cadastro' — { tipo: 'cadastro', cliente: { nome }, titulo: { produto,
// valor, data_vencimento } }. `envio.ultimoTexto`, se vier, é o texto da
// última mensagem desse tipo já mandada pro mesmo cliente (pra não repetir).
// Devolve { tipo, texto } — ou lança erro se o tipo não for um dos que essa
// fase manda.
export function montarMensagemWhatsApp(envio, { aleatorio = Math.random } = {}) {
  const montarVariacoes = VARIACOES_POR_TIPO[envio.tipo];
  if (!montarVariacoes) throw new Error(`Tipo de mensagem desconhecido: ${envio.tipo}`);
  const texto = escolherVariacao(montarVariacoes(envio), envio.ultimoTexto, aleatorio);
  return { tipo: envio.tipo, texto };
}
