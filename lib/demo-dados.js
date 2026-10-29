// Dados FICTÍCIOS da demo pública (e do seed de teste, scripts/seed-teste.mjs).
// Função pura: recebe "hoje" e devolve as linhas prontas pra inserir em
// `clientes`, `titulos`, `pagamentos` e `mensagens` — não fala com o banco.
//
// Todo cliente tem cidade "TESTE" e telefone "(00) 00000-00XX", um número
// diferente por cliente — inválido de propósito, pra nenhuma mensagem de
// WhatsApp chegar a uma pessoa de verdade. Todas as datas são relativas a
// "hoje", então a demo nunca envelhece (a rota de reset recria tudo todo dia).

import { randomUUID } from 'node:crypto';
import { diasEntre, somarDias } from './util.js';
import { montarMensagemWhatsApp } from './mensagens-whatsapp.js';

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

// Os 10 clientes originais do seed de teste. Não mudar a ordem: o telefone de
// cada um é derivado da posição na lista.
const CLIENTES_BASE = [
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

// Clientes a mais, só da demo: variam risco, atrasos e pagamentos parciais
// pras telas (Hoje, Previsão, Relatório) terem o que mostrar.
const CLIENTES_EXTRAS = [
  {
    nome: 'Camila Rodrigues', // cliente nova, vence em 3 dias
    titulos: [aberto('Vestido de festa', 320, 'PIX', 3)],
  },
  {
    nome: 'Marcos Vinícius Teixeira', // cliente novo, vence em 2 dias
    titulos: [aberto('Tênis de corrida', 540, 'Cartão', 2)],
  },
  {
    nome: 'Patrícia Gomes', // ótima pagadora, título a vencer com pagamento parcial
    titulos: [
      quitadoEmDia('Bolsa', 280, 'PIX', -140),
      quitadoEmDia('Sandália', 120, 'Cartão', -100),
      quitadoEmDia('Casaco', 350, 'PIX', -55),
      aberto('Bota', 410, 'PIX', 8, 100),
    ],
  },
  {
    nome: 'Eduardo Martins', // paga sempre atrasado e agora está bem atrasado, com parcial
    titulos: [
      quitadoComAtraso('Camisa', 110, 'Dinheiro', -140),
      quitadoComAtraso('Sapato', 300, 'Cheque', -95),
      quitadoComAtraso('Calça', 160, 'Boleto', -50),
      aberto('Terno', 750, 'Cheque', -25, 200),
    ],
  },
  {
    nome: 'Juliana Castro', // cliente nova, 45 dias de atraso: risco alto
    titulos: [aberto('Jaqueta de couro', 1250, 'Boleto', -45)],
  },
  {
    nome: 'Sérgio Barbosa', // cliente "ouro": tudo quitado em dia
    titulos: [
      quitadoEmDia('Terno', 850, 'PIX', -170),
      quitadoEmDia('Sapato social', 320, 'Cartão', -130),
      quitadoEmDia('Cinto', 90, 'PIX', -95),
      quitadoEmDia('Camisa social', 140, 'PIX', -60),
      quitadoEmDia('Gravata', 70, 'Dinheiro', -30),
    ],
  },
  {
    nome: 'Tatiane Ribeiro', // um título atrasado e outro a vencer, com parcial
    titulos: [
      quitadoEmDia('Blusa', 95, 'PIX', -80),
      aberto('Calça jeans', 180, 'Dinheiro', -7),
      aberto('Jaqueta', 230, 'PIX', 20, 80),
    ],
  },
  {
    nome: 'Vinícius Araújo', // vence hoje
    titulos: [
      quitadoEmDia('Camisa', 85, 'PIX', -70),
      quitadoEmDia('Bermuda', 110, 'Dinheiro', -45),
      aberto('Tênis casual', 95, 'Dinheiro', 0),
    ],
  },
];

// Mensagens de WhatsApp de mentira, pra tela /cobranca não ficar vazia. Os
// textos vêm de montarMensagemWhatsApp (os mesmos do sistema de verdade).
// 'enviada' = já "saiu" há tantas horas; 'pendente_revisao' = esperando
// aprovação. As duas cobranças de atraso 'enviada' (Roberto e Ana Beatriz)
// tiram esses clientes da fila de "Hoje" (já cobrados), de propósito: a fila
// continua com vários outros atrasados e a tela mostra os dois estados.
const MENSAGENS_DEMO = [
  { cliente: 'Camila Rodrigues', tipo: 'cadastro', status: 'enviada', horasAtras: 28 },
  { cliente: 'Marcos Vinícius Teixeira', tipo: 'cadastro', status: 'enviada', horasAtras: 30 },
  { cliente: 'Camila Rodrigues', tipo: 'antes_vencimento', status: 'enviada', horasAtras: 6 },
  { cliente: 'Marcos Vinícius Teixeira', tipo: 'antes_vencimento', status: 'enviada', horasAtras: 4 },
  { cliente: 'Maria Aparecida Souza', tipo: 'vencimento', status: 'enviada', horasAtras: 2 },
  { cliente: 'Roberto Carlos Nunes', tipo: 'atraso', status: 'enviada', horasAtras: 20 },
  { cliente: 'Ana Beatriz Lima', tipo: 'atraso', status: 'enviada', horasAtras: 50 },
  { cliente: 'Carlos Eduardo Pereira', tipo: 'atraso', status: 'pendente_revisao', horasAtras: 0.5 },
  { cliente: 'Pedro Henrique Alves', tipo: 'atraso', status: 'pendente_revisao', horasAtras: 0.4 },
  { cliente: 'Vinícius Araújo', tipo: 'vencimento', status: 'pendente_revisao', horasAtras: 0.3 },
];

function arredondar(valor) {
  return Math.round(valor * 100) / 100;
}

// hoje: 'YYYY-MM-DD' (fuso de Brasília, como hojeBrasil() devolve).
// opções:
//   agora          — instante "de agora" (Date), base dos horários das mensagens.
//   gerarId        — gerador de id (injetável pros testes).
//   incluirExtras  — false = só os 10 clientes originais do seed de teste.
//   incluirMensagens — false = não monta `mensagens`.
export function montarDadosDemo(
  hoje,
  { agora = new Date(), gerarId = randomUUID, incluirExtras = true, incluirMensagens = true } = {}
) {
  const clientes = [];
  const titulos = [];
  const pagamentos = [];
  const porNome = new Map(); // nome -> { id, titulos: [{ id, produto, valor, vencimento, pago, forma }] }

  const lista = incluirExtras ? [...CLIENTES_BASE, ...CLIENTES_EXTRAS] : CLIENTES_BASE;

  lista.forEach((c, i) => {
    const clienteId = gerarId();
    clientes.push({
      id: clienteId,
      nome: c.nome,
      telefone: `(00) 00000-${String(i + 1).padStart(4, '0')}`,
      cidade: 'TESTE',
    });
    const registro = { id: clienteId, titulos: [] };
    porNome.set(c.nome, registro);

    for (const t of c.titulos) {
      const tituloId = gerarId();
      const vencimento = somarDias(hoje, t.venc);
      titulos.push({
        id: tituloId,
        cliente_id: clienteId,
        produto: t.produto,
        valor: t.valor,
        data_venda: somarDias(hoje, t.venc - 30),
        data_vencimento: vencimento,
        forma_pagamento: t.forma,
      });
      let pago = 0;
      for (const p of t.pagamentos) {
        pago = arredondar(pago + p.valor);
        pagamentos.push({
          titulo_id: tituloId,
          valor: p.valor,
          forma_pagamento: p.forma,
          data_pagamento: somarDias(hoje, p.quando),
        });
      }
      registro.titulos.push({ id: tituloId, produto: t.produto, valor: t.valor, vencimento, pago });
    }
  });

  const mensagens = incluirMensagens && incluirExtras ? montarMensagens({ hoje, agora, porNome }) : [];

  return { clientes, titulos, pagamentos, mensagens };
}

function montarMensagens({ hoje, agora, porNome }) {
  return MENSAGENS_DEMO.map((m, indice) => {
    const registro = porNome.get(m.cliente);
    const abertos = registro.titulos
      .map((t) => ({ ...t, restante: arredondar(t.valor - t.pago) }))
      .filter((t) => t.restante > 0);

    const nomeCliente = { nome: m.cliente };
    let envio;
    let tituloId = null;
    if (m.tipo === 'atraso') {
      const atrasados = abertos.filter((t) => t.vencimento < hoje);
      envio = {
        tipo: 'atraso',
        cliente: nomeCliente,
        titulos: atrasados.map((t) => ({ data_vencimento: t.vencimento })),
        totalRestante: arredondar(atrasados.reduce((soma, t) => soma + t.restante, 0)),
        maiorAtraso: Math.max(...atrasados.map((t) => diasEntre(t.vencimento, hoje))),
      };
    } else {
      // cadastro, antes_vencimento e vencimento falam da compra em aberto (a mais recente).
      const alvo = abertos[abertos.length - 1];
      tituloId = alvo.id;
      envio =
        m.tipo === 'cadastro'
          ? { tipo: 'cadastro', cliente: nomeCliente, titulo: { produto: alvo.produto, valor: alvo.valor, data_vencimento: alvo.vencimento } }
          : {
              tipo: m.tipo,
              cliente: nomeCliente,
              titulo: { valor_restante: alvo.restante, data_vencimento: alvo.vencimento },
              dias: diasEntre(hoje, alvo.vencimento),
            };
    }

    // Variação de frase previsível (não aleatória): o reset sempre monta o mesmo feed.
    const { texto } = montarMensagemWhatsApp(envio, { aleatorio: () => (indice % 4) / 4 });
    const instante = new Date(agora.getTime() - m.horasAtras * 60 * 60 * 1000).toISOString();

    return {
      cliente_id: registro.id,
      titulo_id: tituloId,
      tipo: m.tipo,
      texto,
      status: m.status,
      enviado_em: m.status === 'enviada' ? instante : null,
      criado_em: instante,
    };
  });
}
