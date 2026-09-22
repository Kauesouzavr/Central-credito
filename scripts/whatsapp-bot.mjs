// Central de Crédito — Fase 6: bot de WhatsApp (Baileys, não-oficial).
//
// Processo que fica rodando (não é um script de um clique só): conecta no
// WhatsApp por QR code, mantém a sessão salva em ./whatsapp-auth (não
// versionada — está no .gitignore, é a "senha" da sessão) e, a cada
// INTERVALO_CICLO_MS, olha o banco e manda as mensagens que a régua
// (lib/regua.js) decidir que são de hoje: aviso antes do vencimento,
// vencimento e cobrança de atraso. Respeita limite de mensagens por
// hora/dia e um atraso aleatório entre um envio e o outro (lib/limite-envio.js).
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

async function contarEnviadasDesde(desdeIso) {
  const { count, error } = await supabase
    .from('mensagens')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'enviada')
    .gte('enviado_em', desdeIso);
  if (error) throw error;
  return count ?? 0;
}

// Um ciclo: lê o banco, monta a régua de hoje e manda o que ainda faltar,
// respeitando o limite configurado. Para no meio se bater o limite — o resto
// fica pra tentar nos próximos ciclos, sem se perder (não repete quem já foi
// marcado como 'enviada').
async function cicloDeEnvio(sock) {
  const { data: config, error: erroConfig } = await supabase.from('configuracoes').select('*').eq('id', 1).single();
  if (erroConfig) throw erroConfig;

  const hoje = hojeBrasil();

  const titulos = await buscarTudo(() =>
    supabase
      .from('titulos_com_saldo')
      .select('id, cliente_id, data_vencimento, status, dias_atraso, valor_restante')
      .order('id')
  );
  const clientes = await buscarTudo(() => supabase.from('clientes').select('id, nome, telefone').order('id'));
  const mensagensEnviadas = await buscarTudo(() =>
    supabase.from('mensagens').select('id, cliente_id, titulo_id, tipo, enviado_em').eq('status', 'enviada').order('id')
  );

  const envios = montarRegua({
    titulos,
    clientes,
    mensagensEnviadas,
    hoje,
    diasAntesAviso: Number(config.dias_antes_aviso),
    diasRepetirCobranca: Number(config.dias_repetir_cobranca),
  });

  if (envios.length === 0) {
    console.log(`[${new Date().toLocaleTimeString('pt-BR')}] Nada pra mandar agora.`);
    return;
  }

  console.log(`[${new Date().toLocaleTimeString('pt-BR')}] ${envios.length} mensagem(ns) pra mandar.`);

  for (const envio of envios) {
    const desdeUltimaHora = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const [enviadasUltimaHora, enviadasHoje] = await Promise.all([
      contarEnviadasDesde(desdeUltimaHora),
      contarEnviadasDesde(inicioDoDiaBrasil(hoje)),
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

    const telefone = formatarTelefoneE164(envio.cliente.telefone);
    const { tipo, texto } = montarMensagemWhatsApp(envio);
    const tituloId = envio.titulo ? envio.titulo.id : null; // 'atraso' pode juntar vários títulos: não amarra a um só

    if (!telefone) {
      console.log(`Pulei ${envio.cliente.nome}: telefone "${envio.cliente.telefone}" não parece válido.`);
      continue;
    }

    const { data: registro, error: erroInsert } = await supabase
      .from('mensagens')
      .insert({ cliente_id: envio.cliente.id, titulo_id: tituloId, tipo, texto, status: 'pendente' })
      .select('id')
      .single();
    if (erroInsert) {
      console.error(`Erro ao registrar mensagem de ${envio.cliente.nome}:`, erroInsert.message);
      continue;
    }

    try {
      await sock.sendMessage(`${telefone}@s.whatsapp.net`, { text: texto });
      await supabase.from('mensagens').update({ status: 'enviada', enviado_em: new Date().toISOString() }).eq('id', registro.id);
      console.log(`Mandei pra ${envio.cliente.nome} (${tipo}).`);
    } catch (e) {
      await supabase.from('mensagens').update({ status: 'erro' }).eq('id', registro.id);
      console.error(`Erro ao mandar pra ${envio.cliente.nome}:`, e.message);
    }

    await esperar(atrasoAleatorioMs(config.whatsapp_atraso_min_segundos, config.whatsapp_atraso_max_segundos));
  }
}

// A conexão pode cair e reconectar sozinha (rede, celular sem internet etc.).
// `sockAtual` sempre aponta pro socket vivo no momento; o loop de envio em
// main() usa essa referência, em vez de reiniciar o loop inteiro a cada queda.
let sockAtual = null;

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
    }

    if (connection === 'close') {
      sockAtual = null;
      const motivo = lastDisconnect?.error?.output?.statusCode;
      const deslogado = motivo === DisconnectReason.loggedOut;
      if (deslogado) {
        console.error(
          'Sessão desconectada pelo celular. Apague a pasta whatsapp-auth e rode "npm run whatsapp:bot" de novo pra reconectar com um QR code novo.'
        );
        process.exit(1);
      }
      console.log('Conexão caiu, tentando reconectar...');
      conectar();
    }
  });
}

async function main() {
  await conectar();
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
