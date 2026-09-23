// Central de Crédito — Fase 6: bot de WhatsApp (Baileys, não-oficial).
//
// Processo que fica rodando (não é um script de um clique só): conecta no
// WhatsApp por QR code, mantém a sessão salva em ./whatsapp-auth (não
// versionada — está no .gitignore, é a "senha" da sessão) e, a cada
// INTERVALO_CICLO_MS, faz duas coisas:
//   1. Enfileira (grava em `mensagens`, status 'pendente') o que a régua
//      (lib/regua.js) decidir que é de hoje: aviso antes do vencimento,
//      vencimento e cobrança de atraso.
//   2. Manda tudo que estiver 'pendente' — o que acabou de enfileirar, e
//      também o que outra parte do app já deixou pronto (ex.: a mensagem de
//      'cadastro', gravada por app/clientes/novo/actions.js na hora que um
//      cliente novo é criado).
// Respeita limite de mensagens por hora/dia e um atraso aleatório entre um
// envio e o outro (lib/limite-envio.js).
//
//   npm run whatsapp:bot
//
// Na primeira vez, escaneie o QR code que aparece no terminal (WhatsApp no
// celular > Aparelhos conectados > Conectar um aparelho). Nas próximas, a
// sessão salva reconecta sozinha, sem pedir QR de novo — a não ser que você
// apague a pasta whatsapp-auth ou desconecte pelo celular.

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { createClient } from '@supabase/supabase-js';
import { buscarTudo } from '../lib/carregar-risco.js';
import { montarRegua } from '../lib/regua.js';
import { montarMensagemWhatsApp } from '../lib/mensagens-whatsapp.js';
import { podeEnviarMais, atrasoAleatorioMs } from '../lib/limite-envio.js';
import { formatarTelefoneE164, hojeBrasil, inicioDoDiaBrasil } from '../lib/util.js';
import { MARCA_COBRANCA_MANUAL } from '../lib/hoje.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PASTA_SESSAO = path.join(__dirname, '..', 'whatsapp-auth');
const INTERVALO_CICLO_MS = 10 * 60 * 1000; // a cada 10 min, olha se tem mensagem nova pra mandar

const url = process.env.SUPABASE_URL;
const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !chave) {
  console.error('Faltam SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no .env.local');
  process.exit(1);
}
const supabase = createClient(url, chave, { auth: { persistSession: false } });

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Só conta mensagem que passou pelo WhatsApp de verdade — o "Já cobrei"
// manual (app/actions.js) também grava status 'enviada', mas não usa o
// Baileys, então não deve contar pro limite de mensagens.
async function contarEnviadasDesde(desdeIso) {
  const { count, error } = await supabase
    .from('mensagens')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'enviada')
    .neq('texto', MARCA_COBRANCA_MANUAL)
    .gte('enviado_em', desdeIso);
  if (error) throw error;
  return count ?? 0;
}

// Passo 1: olha a régua e enfileira (grava 'pendente') o que for de hoje.
// Não manda nada aqui — só decide e grava. `mensagens` com status 'enviada'
// OU 'pendente' contam como "já enfileirado" pra régua não duplicar (lib/regua.js).
//
// O texto de antes_vencimento/vencimento/atraso é calculado AGORA (dias até
// vencer, valor em aberto), não na hora de mandar — se a fila acumular (bot
// fora do ar, ou mais mensagem num ciclo do que o limite por hora permite) e
// um envio só sair em outro ciclo, o texto pode ficar um pouco desatualizado
// (ex.: "vence em 3 dias" chegando quando já venceu). Não deve acontecer no
// volume de uma loja pequena com os limites padrão, mas é a troca feita aqui
// — resolver de verdade pediria recalcular o texto na hora do envio.
async function enfileirarRegua(config, clientes) {
  const hoje = hojeBrasil();

  const [titulos, mensagensExistentes] = await Promise.all([
    buscarTudo(() =>
      supabase
        .from('titulos_com_saldo')
        .select('id, cliente_id, data_vencimento, status, dias_atraso, valor_restante')
        .order('id')
    ),
    buscarTudo(() =>
      supabase
        .from('mensagens')
        .select('id, cliente_id, titulo_id, tipo, enviado_em')
        .in('status', ['enviada', 'pendente'])
        .order('id')
    ),
  ]);

  const envios = montarRegua({
    titulos,
    clientes,
    mensagensEnviadas: mensagensExistentes,
    hoje,
    diasAntesAviso: Number(config.dias_antes_aviso),
    diasRepetirCobranca: Number(config.dias_repetir_cobranca),
  });

  for (const envio of envios) {
    // Confere o telefone JÁ AQUI, antes de gravar — não em mandarPendentes.
    // Se validasse só na hora de mandar, um telefone inválido viraria 'erro',
    // a régua não reconhece 'erro' como "já enfileirado" (de propósito: erro
    // de rede precisa poder tentar de novo) e o mesmo cliente voltaria a ser
    // enfileirado e falhar, pra sempre, todo ciclo. Assim ele nem entra na fila.
    const telefone = formatarTelefoneE164(envio.cliente.telefone);
    if (!telefone) {
      // De propósito NÃO grava nada aqui (diferente de mandarPendentes, que
      // marca 'erro' pro mesmo caso): a régua ignora 'erro' pra permitir
      // retentativa depois de falha transitória, então gravar 'erro' aqui
      // faria essa mesma mensagem ser recriada e falhar de novo a cada
      // ciclo, pra sempre — o problema que essa checagem existe pra evitar.
      console.log(`Pulei ${envio.cliente.nome}: telefone "${envio.cliente.telefone}" não parece válido.`);
      continue;
    }

    const { tipo, texto } = montarMensagemWhatsApp(envio);
    const tituloId = envio.titulo ? envio.titulo.id : null; // 'atraso' pode juntar vários títulos: não amarra a um só
    const { error: erroInsert } = await supabase
      .from('mensagens')
      .insert({ cliente_id: envio.cliente.id, titulo_id: tituloId, tipo, texto, status: 'pendente' });
    if (erroInsert) {
      console.error(`Erro ao enfileirar mensagem de ${envio.cliente.nome}:`, erroInsert.message);
      // Mesma pausa que mandarPendentes usa entre envios — sem ela, uma falha
      // que se repete pros próximos da fila martela o banco sem intervalo.
      await esperar(atrasoAleatorioMs(config.whatsapp_atraso_min_segundos, config.whatsapp_atraso_max_segundos));
    }
  }
}

// Passo 2: manda tudo que estiver 'pendente' — da régua ou de qualquer outro
// lugar do app (ex.: cadastro) — respeitando o limite configurado. Para no
// meio se bater o limite; o resto fica 'pendente' pro próximo ciclo.
// `clientes` já vem carregado de cicloDeEnvio — cobre qualquer cliente com
// mensagem pendente, mesmo um que a régua nunca teria escolhido (cadastro).
async function mandarPendentes(sock, config, clientes) {
  const pendentes = await buscarTudo(() =>
    supabase.from('mensagens').select('id, cliente_id, tipo, texto').eq('status', 'pendente').order('criado_em')
  );

  if (pendentes.length === 0) {
    console.log(`[${new Date().toLocaleTimeString('pt-BR')}] Nada pra mandar agora.`);
    return;
  }

  console.log(`[${new Date().toLocaleTimeString('pt-BR')}] ${pendentes.length} mensagem(ns) pra mandar.`);

  const clientePorId = new Map(clientes.map((c) => [c.id, c]));

  for (const msg of pendentes) {
    // Reconsulta os dois a cada envio, sempre a partir do banco (não soma
    // local): assim os limites continuam corretos mesmo se o ciclo demorar
    // mais que uma hora, virar o dia no meio, ou se algum "marcar como
    // enviada" falhar — nenhum desses casos desalinha a conta.
    const [enviadasUltimaHora, enviadasHoje] = await Promise.all([
      contarEnviadasDesde(new Date(Date.now() - 60 * 60 * 1000).toISOString()),
      contarEnviadasDesde(inicioDoDiaBrasil(hojeBrasil())),
    ]);

    if (
      !podeEnviarMais({
        enviadasUltimaHora,
        enviadasHoje,
        limitePorHora: config.whatsapp_limite_por_hora,
        limitePorDia: config.whatsapp_limite_por_dia,
      })
    ) {
      console.log('Limite de mensagens atingido — o resto fica pro próximo ciclo.');
      break;
    }

    const cliente = clientePorId.get(msg.cliente_id);
    const telefone = cliente ? formatarTelefoneE164(cliente.telefone) : null;
    const nome = cliente ? cliente.nome : msg.cliente_id;

    if (!telefone) {
      console.log(`Pulei ${nome}: telefone "${cliente?.telefone ?? '—'}" não parece válido.`);
      // Marca como erro em vez de deixar 'pendente' pra sempre — sem isso,
      // um telefone inválido reaparece nessa mesma checagem a cada ciclo,
      // sem nenhum jeito de saber (fora de olhar o log) que nunca vai sair.
      await supabase.from('mensagens').update({ status: 'erro' }).eq('id', msg.id);
      await esperar(atrasoAleatorioMs(config.whatsapp_atraso_min_segundos, config.whatsapp_atraso_max_segundos));
      continue;
    }

    try {
      await sock.sendMessage(`${telefone}@s.whatsapp.net`, { text: msg.texto });
      const { error: erroUpdate } = await supabase
        .from('mensagens')
        .update({ status: 'enviada', enviado_em: new Date().toISOString() })
        .eq('id', msg.id);
      if (erroUpdate) {
        // A mensagem já foi mandada de verdade pro WhatsApp — só o registro no
        // banco que não atualizou. Avisa alto: sem isso a régua vai achar que
        // esse cliente nunca foi avisado e manda nele de novo no próximo ciclo.
        console.error(`Mandei pra ${nome}, mas não consegui marcar como 'enviada' no banco:`, erroUpdate.message);
      } else {
        console.log(`Mandei pra ${nome} (${msg.tipo}).`);
      }
    } catch (e) {
      await supabase.from('mensagens').update({ status: 'erro' }).eq('id', msg.id);
      console.error(`Erro ao mandar pra ${nome}:`, e.message);
    }

    await esperar(atrasoAleatorioMs(config.whatsapp_atraso_min_segundos, config.whatsapp_atraso_max_segundos));
  }
}

async function cicloDeEnvio(sock) {
  const { data: config, error: erroConfig } = await supabase.from('configuracoes').select('*').eq('id', 1).single();
  if (erroConfig) throw erroConfig;

  // Um fetch só, usado nos dois passos — enfileirarRegua e mandarPendentes
  // não precisam ler `clientes` cada um por conta própria.
  const clientes = await buscarTudo(() => supabase.from('clientes').select('id, nome, telefone').order('id'));

  await enfileirarRegua(config, clientes);

  // Pausado pela tela de Cobrança (Fase 8): continua enfileirando (não toca
  // no WhatsApp), só não manda nada até a pessoa retomar.
  if (config.whatsapp_pausado) {
    console.log(`[${new Date().toLocaleTimeString('pt-BR')}] Envios pausados — nada foi mandado neste ciclo.`);
    return;
  }

  await mandarPendentes(sock, config, clientes);
}

// A conexão pode cair e reconectar sozinha (rede, celular sem internet etc.).
// `sockAtual` sempre aponta pro socket vivo no momento; o loop de envio em
// main() usa essa referência, em vez de reiniciar o loop inteiro a cada queda.
let sockAtual = null;

// Depois de muitas quedas seguidas (sem nenhuma conexão ESTÁVEL no meio),
// para de tentar e derruba o processo — sem isso, um problema permanente
// (sessão corrompida, protocolo incompatível) fica tentando de novo pra
// sempre, em silêncio, parecendo que está tudo bem.
let falhasConsecutivas = 0;
const MAX_FALHAS_CONSECUTIVAS = 10;

// Uma sessão corrompida costuma conectar por alguns segundos e cair nesse
// meio-tempo, em loop (visto na prática: "Decrypted message with closed
// session" e cai de novo). Só zera o contador de falhas depois de ficar
// conectado por tempo suficiente — senão esse loop nunca soma falha nenhuma
// (some conecta, reseta, cai — de novo, pra sempre) e o bot nunca desiste.
const TEMPO_PARA_CONSIDERAR_ESTAVEL_MS = 30_000;
let temporizadorEstabilidade = null;

async function conectar() {
  const { state, saveCreds } = await useMultiFileAuthState(PASTA_SESSAO);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger: pino({ level: 'silent' }),
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\nEscaneie este QR code no WhatsApp (Aparelhos conectados > Conectar um aparelho):\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      sockAtual = sock;
      console.log('Conectado ao WhatsApp.');
      temporizadorEstabilidade = setTimeout(() => {
        falhasConsecutivas = 0;
      }, TEMPO_PARA_CONSIDERAR_ESTAVEL_MS);
    }

    if (connection === 'close') {
      sockAtual = null;
      if (temporizadorEstabilidade) {
        clearTimeout(temporizadorEstabilidade);
        temporizadorEstabilidade = null;
      }
      const motivo = lastDisconnect?.error?.output?.statusCode;
      const deslogado = motivo === DisconnectReason.loggedOut;
      if (deslogado) {
        console.error(
          'Sessão desconectada pelo celular. Apague a pasta whatsapp-auth e rode "npm run whatsapp:bot" de novo pra reconectar com um QR code novo.'
        );
        process.exit(1);
      }
      registrarFalhaEReconectar('Conexão caiu');
    }
  });
}

// Conta mais uma falha (queda ou erro ao tentar conectar) e ou tenta de novo
// em 10s, ou — depois de muitas seguidas — desiste e derruba o processo com
// uma mensagem clara, em vez de ficar tentando pra sempre sem avisar ninguém.
function registrarFalhaEReconectar(motivo) {
  falhasConsecutivas += 1;
  if (falhasConsecutivas >= MAX_FALHAS_CONSECUTIVAS) {
    console.error(
      `${motivo}: ${falhasConsecutivas} vezes seguidas sem conseguir ficar conectado. Desisti — confira a internet. Se continuar caindo mesmo assim, a sessão salva (pasta whatsapp-auth) pode ter corrompido: apague-a e rode "npm run whatsapp:bot" de novo pra reconectar com um QR code novo.`
    );
    process.exit(1);
  }
  console.log(`${motivo}, tentando reconectar (${falhasConsecutivas}/${MAX_FALHAS_CONSECUTIVAS})...`);
  setTimeout(conectarComRetentativa, 10_000);
}

// Tenta conectar; se falhar de cara (rede fora do ar, sessão corrompida
// etc.), conta como falha e agenda nova tentativa — sem isso, uma rejeição
// sem handler aqui derrubaria o processo inteiro sem nenhuma mensagem clara.
function conectarComRetentativa() {
  conectar().catch((e) => registrarFalhaEReconectar(`Erro ao conectar (${e.message})`));
}

async function main() {
  conectarComRetentativa();
  while (!sockAtual) await esperar(500); // espera a primeira conexão abrir (ou o QR ser escaneado)

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      if (sockAtual) await cicloDeEnvio(sockAtual);
    } catch (e) {
      console.error('Erro no ciclo de envio:', e.message);
    }
    await esperar(INTERVALO_CICLO_MS);
  }
}

main();
