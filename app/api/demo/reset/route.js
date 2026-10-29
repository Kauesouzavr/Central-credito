import { createHash, timingSafeEqual } from 'node:crypto';
import { getSupabaseServerClient } from '../../../../lib/supabase-server';
import { demoAtiva, operacaoDestrutivaAutorizada } from '../../../../lib/demo-guard';
import { montarDadosDemo } from '../../../../lib/demo-dados';
import { hojeBrasil } from '../../../../lib/util';

// Demo pública: restauração diária (cron da Vercel, ver vercel.json). Apaga
// TUDO (inclusive o que os visitantes criaram) e recria os dados fictícios.
//
// Três travas, nessa ordem:
//   1. DEMO_MODE=1 — fora da demo a rota nem existe (404).
//   2. "Authorization: Bearer <CRON_SECRET>" — o proxy.js deixa essa rota
//      passar sem login, então é ela que se protege.
//   3. demo-guard — o SUPABASE_URL tem que ser exatamente o projeto da demo.

// Valores padrão da linha única de `configuracoes` (os mesmos do schema.sql).
const CONFIGURACOES_PADRAO = {
  id: 1,
  dias_antes_aviso: 3,
  dias_repetir_cobranca: 7,
  limite_atraso: 15,
  peso_mudanca_padrao: 20,
  corte_risco_alto: 55,
  corte_risco_medio: 25,
  whatsapp_limite_por_hora: 20,
  whatsapp_limite_por_dia: 100,
  whatsapp_atraso_min_segundos: 20,
  whatsapp_atraso_max_segundos: 90,
  whatsapp_pausado: false,
  whatsapp_envio_automatico: true,
};

// Compara os hashes (tamanho fixo) em vez do texto: timingSafeEqual exige
// buffers do mesmo tamanho, e assim o tamanho do segredo também não vaza.
function tokenConfere(recebido, esperado) {
  const a = createHash('sha256').update(recebido).digest();
  const b = createHash('sha256').update(esperado).digest();
  return timingSafeEqual(a, b);
}

function resposta(corpo, status) {
  return Response.json(corpo, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function GET(request) {
  if (!demoAtiva()) {
    return new Response('Not found', { status: 404 });
  }

  const segredo = process.env.CRON_SECRET;
  if (!segredo || segredo.length < 32) {
    return resposta({ ok: false, erro: 'CRON_SECRET ausente ou curto demais (mínimo 32 caracteres).' }, 500);
  }

  const cabecalho = request.headers.get('authorization') ?? '';
  const prefixo = 'Bearer ';
  if (!cabecalho.startsWith(prefixo) || !tokenConfere(cabecalho.slice(prefixo.length), segredo)) {
    return resposta({ ok: false, erro: 'Não autorizado.' }, 401);
  }

  if (!operacaoDestrutivaAutorizada()) {
    return resposta({ ok: false, erro: 'Recusado: o banco configurado não é o projeto da demo.' }, 403);
  }

  const supabase = getSupabaseServerClient();

  try {
    // O Supabase recusa DELETE sem filtro; "id não é nulo" vale pra toda linha.
    // Títulos, pagamentos e mensagens saem junto (on delete cascade).
    const { error: erroApagar } = await supabase.from('clientes').delete().not('id', 'is', null);
    if (erroApagar) throw new Error(`apagar clientes: ${erroApagar.message}`);

    const { clientes, titulos, pagamentos, mensagens } = montarDadosDemo(hojeBrasil());
    for (const [tabela, linhas] of [
      ['clientes', clientes],
      ['titulos', titulos],
      ['pagamentos', pagamentos],
      ['mensagens', mensagens],
    ]) {
      const { error } = await supabase.from(tabela).insert(linhas);
      if (error) throw new Error(`criar ${tabela}: ${error.message}`);
    }

    const { error: erroConfig } = await supabase.from('configuracoes').upsert(CONFIGURACOES_PADRAO, { onConflict: 'id' });
    if (erroConfig) throw new Error(`restaurar configuracoes: ${erroConfig.message}`);

    const { error: erroPerfil } = await supabase
      .from('perfis')
      .update({ nome_negocio: 'Loja Exemplo' })
      .not('user_id', 'is', null);
    if (erroPerfil) throw new Error(`restaurar perfis: ${erroPerfil.message}`);

    return resposta(
      {
        ok: true,
        clientes: clientes.length,
        titulos: titulos.length,
        pagamentos: pagamentos.length,
        mensagens: mensagens.length,
      },
      200
    );
  } catch (e) {
    console.error('Falha ao restaurar a demo:', e.message);
    return resposta({ ok: false, erro: e.message }, 500);
  }
}
