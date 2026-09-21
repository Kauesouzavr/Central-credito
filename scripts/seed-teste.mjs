// Dados FICTÍCIOS para testar o sistema (10 clientes, cada um numa situação
// diferente do motor de risco).
//
//   npm run seed:teste           apaga os clientes de teste antigos e cria 10 novos
//   npm run seed:teste:remover   só apaga os clientes de teste
//
// Todo cliente de teste tem segmento "TESTE" e telefone "(00) 00000-00XX" —
// número inválido de propósito, pra nenhuma mensagem de WhatsApp (Fase 6)
// chegar a uma pessoa de verdade. Só esses clientes são apagados; títulos e
// pagamentos deles saem junto (on delete cascade). Clientes reais não são tocados.

import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { hojeBrasil } from '../lib/util.js';

const url = process.env.SUPABASE_URL;
const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !chave) {
  console.error('Faltam SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY no .env.local');
  process.exit(1);
}
const supabase = createClient(url, chave, { auth: { persistSession: false } });

const hoje = hojeBrasil();

// Data de "hoje + n dias" (n negativo = no passado), como YYYY-MM-DD.
function emDias(n) {
  const data = new Date(`${hoje}T12:00:00Z`);
  data.setUTCDate(data.getUTCDate() + n);
  return data.toISOString().slice(0, 10);
}

// ----- Montagem dos títulos (todos os prazos em dias, relativos a hoje) -----

// Título quitado 1 dia ANTES do vencimento.
const quitadoEmDia = (produto, valor, forma, venc) => ({
  produto,
  valor,
  forma,
  venc,
  pagamentos: [{ valor, forma, quando: venc - 1 }],
});

// Título quitado 5 dias DEPOIS do vencimento (pago com atraso).
const quitadoComAtraso = (produto, valor, forma, venc) => ({
  produto,
  valor,
  forma,
  venc,
  pagamentos: [{ valor, forma, quando: venc + 5 }],
});

// Título em aberto (venc < 0 = já atrasado), opcionalmente com pagamento parcial.
const aberto = (produto, valor, forma, venc, jaPago = 0) => ({
  produto,
  valor,
  forma,
  venc,
  pagamentos: jaPago > 0 ? [{ valor: jaPago, forma, quando: -2 }] : [],
});

const CLIENTES = [
  // --- clientes NOVOS (nada quitado ainda) ---
  {
    nome: 'Maria Aparecida Souza',
    titulos: [aberto('Sandália', 150, 'PIX', 0)], // vence hoje
  },
  {
    nome: 'Ana Beatriz Lima',
    titulos: [aberto('Camisa polo', 89.9, 'Dinheiro', -3)], // 3 dias de atraso
  },
  {
    nome: 'Carlos Eduardo Pereira',
    titulos: [aberto('Tênis esportivo', 420, 'Cartão', -10)], // 10 dias de atraso
  },
  {
    nome: 'Lúcia Fernandes',
    titulos: [aberto('Bota de couro', 980, 'Cheque', -20)], // 20 dias de atraso
  },

  // --- clientes ANTIGOS que já pagaram tudo (voltam pra comprar de novo) ---
  {
    nome: 'José Antônio Ramos',
    titulos: [
      quitadoEmDia('Sapato social', 250, 'PIX', -150),
      quitadoEmDia('Cinto', 80, 'Dinheiro', -120),
      quitadoEmDia('Calça jeans', 180, 'Cartão', -90),
      quitadoEmDia('Camisa social', 130, 'PIX', -60),
    ],
  },
  {
    nome: 'Rita de Cássia Moura',
    titulos: [
      quitadoComAtraso('Vestido', 320, 'Boleto', -150),
      quitadoComAtraso('Bolsa', 210, 'Cheque', -120),
      quitadoComAtraso('Sandália', 110, 'Dinheiro', -90),
      quitadoEmDia('Cinto', 70, 'PIX', -60),
    ],
  },

  // --- clientes ANTIGOS com pendência ---
  {
    nome: 'João Batista Costa', // sempre pagou em dia e agora atrasou
    titulos: [
      quitadoEmDia('Jaqueta', 390, 'PIX', -150),
      quitadoEmDia('Tênis', 280, 'Cartão', -120),
      quitadoEmDia('Mochila', 160, 'Dinheiro', -90),
      quitadoEmDia('Meia (kit)', 45, 'PIX', -60),
      aberto('Camisa social', 260, 'PIX', -5),
    ],
  },
  {
    nome: 'Pedro Henrique Alves', // já atrasou antes e está atrasado de novo
    titulos: [
      quitadoEmDia('Bermuda', 120, 'Dinheiro', -150),
      quitadoComAtraso('Tênis', 350, 'Boleto', -100),
      quitadoComAtraso('Jaqueta', 480, 'Cheque', -60),
      aberto('Calça jeans', 200, 'Boleto', -10),
    ],
  },
  {
    nome: 'Fernanda Oliveira', // bom histórico + título a vencer com pagamento parcial
    titulos: [
      quitadoEmDia('Vestido', 300, 'PIX', -150),
      quitadoEmDia('Sapato', 240, 'Cartão', -110),
      quitadoEmDia('Bolsa', 190, 'PIX', -70),
      aberto('Jaqueta de couro', 300, 'PIX', 15, 150), // pagou metade
    ],
  },
  {
    nome: 'Roberto Carlos Nunes', // dois títulos atrasados ao mesmo tempo
    titulos: [
      quitadoEmDia('Camisa', 90, 'Dinheiro', -120),
      quitadoComAtraso('Sapato', 260, 'Cheque', -80),
      aberto('Terno', 900, 'Cheque', -16),
      aberto('Gravata', 60, 'Dinheiro', -6),
    ],
  },
];

async function removerTeste() {
  const { data, error } = await supabase
    .from('clientes')
    .delete()
    .eq('segmento', 'TESTE')
    .like('telefone', '(00)%')
    .select('id');
  if (error) throw error;
  return data.length;
}

async function criarTeste() {
  const clientes = [];
  const titulos = [];
  const pagamentos = [];

  CLIENTES.forEach((c, i) => {
    const clienteId = randomUUID();
    clientes.push({
      id: clienteId,
      nome: c.nome,
      telefone: `(00) 00000-${String(i + 1).padStart(4, '0')}`,
      segmento: 'TESTE',
    });

    for (const t of c.titulos) {
      const tituloId = randomUUID();
      titulos.push({
        id: tituloId,
        cliente_id: clienteId,
        produto: t.produto,
        valor: t.valor,
        data_venda: emDias(t.venc - 30),
        data_vencimento: emDias(t.venc),
        forma_pagamento: t.forma,
      });
      for (const p of t.pagamentos) {
        pagamentos.push({
          titulo_id: tituloId,
          valor: p.valor,
          forma_pagamento: p.forma,
          data_pagamento: emDias(p.quando),
        });
      }
    }
  });

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
