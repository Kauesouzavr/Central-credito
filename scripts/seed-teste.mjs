// Dados FICTÍCIOS para testar o sistema (10 clientes, cada um numa situação
// diferente do motor de risco).
//
//   npm run seed:teste           apaga os clientes de teste antigos e cria 10 novos
//   npm run seed:teste:remover   só apaga os clientes de teste
//
// Todo cliente de teste tem cidade "TESTE" e telefone "(00) 00000-00XX" —
// número inválido de propósito, pra nenhuma mensagem de WhatsApp (Fase 6)
// chegar a uma pessoa de verdade. Só esses clientes são apagados; títulos e
// pagamentos deles saem junto (on delete cascade). Clientes reais não são tocados.

import { createClient } from '@supabase/supabase-js';
import { hojeBrasil } from '../lib/util.js';
import { montarDadosDemo } from '../lib/demo-dados.js';

const url = process.env.SUPABASE_URL;
const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !chave) {
  console.error('Faltam SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no .env.local');
  process.exit(1);
}
const supabase = createClient(url, chave, { auth: { persistSession: false } });

const hoje = hojeBrasil();

async function removerTeste() {
  const { data, error } = await supabase
    .from('clientes')
    .delete()
    .eq('cidade', 'TESTE')
    .like('telefone', '(00)%')
    .select('id');
  if (error) throw error;
  return data.length;
}

async function criarTeste() {
  // Só os 10 clientes originais, sem mensagens (a demo pública usa o conjunto
  // completo, ver app/api/demo/reset/route.js).
  const { clientes, titulos, pagamentos } = montarDadosDemo(hoje, { incluirExtras: false, incluirMensagens: false });

  for (const [tabela, linhas] of [
    ['clientes', clientes],
    ['titulos', titulos],
    ['pagamentos', pagamentos],
  ]) {
    const { error } = await supabase.from(tabela).insert(linhas);
    if (error) throw new Error(`Erro ao criar ${tabela}: ${error.message}`);
  }

  return { clientes: clientes.length, titulos: titulos.length, pagamentos: pagamentos.length };
}

try {
  const removidos = await removerTeste();
  console.log(`Clientes de teste removidos: ${removidos}`);

  if (process.argv.includes('--remover')) {
    console.log('Pronto: só o que era de teste foi apagado.');
  } else {
    const criados = await criarTeste();
    console.log(
      `Criados: ${criados.clientes} clientes, ${criados.titulos} títulos, ${criados.pagamentos} pagamentos (hoje = ${hoje}).`
    );
  }
} catch (e) {
  console.error('Falhou:', e.message);
  process.exit(1);
}
