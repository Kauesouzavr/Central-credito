// Fase 6: limite de mensagens e atraso aleatório entre envios do bot do
// WhatsApp (scripts/whatsapp-bot.mjs). Funções puras — quem chama conta
// quantas mensagens 'enviada' já saíram na última hora/hoje (lendo a tabela
// `mensagens`) e passa os números prontos aqui.
//
// Existem por dois motivos: não estourar o número de mensagens que uma loja
// pequena mandaria manualmente num dia, e não mandar tudo em rajada — os
// dois reduzem o risco de o número ser bloqueado, já que o Baileys não é a
// API oficial do WhatsApp.

// limitePorHora / limitePorDia: null ou undefined = sem limite.
export function podeEnviarMais({ enviadasUltimaHora, enviadasHoje, limitePorHora, limitePorDia }) {
  if (limitePorDia != null && enviadasHoje >= limitePorDia) return false;
  if (limitePorHora != null && enviadasUltimaHora >= limitePorHora) return false;
  return true;
}

// Atraso aleatório, em milissegundos, entre um envio e o próximo.
export function atrasoAleatorioMs(minSegundos, maxSegundos) {
  const min = Math.min(minSegundos, maxSegundos);
  const max = Math.max(minSegundos, maxSegundos);
  const segundos = min + Math.random() * (max - min);
  return Math.round(segundos * 1000);
}
