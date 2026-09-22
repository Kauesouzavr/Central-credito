import { calcularRisco } from './risco.js';

// O Supabase devolve no máximo 1000 linhas por consulta. Como a nota de risco
// depende do histórico inteiro, buscar "só a primeira página" daria nota errada
// sem avisar — então as consultas são lidas página por página até acabar.
const TAMANHO_PAGINA = 1000;
// Quantos títulos entram numa consulta de pagamentos (limite de tamanho da URL).
const TAMANHO_LOTE = 100;

export async function buscarTudo(criarConsulta) {
  const linhas = [];
  for (let de = 0; ; de += TAMANHO_PAGINA) {
    const { data, error } = await criarConsulta().range(de, de + TAMANHO_PAGINA - 1);
    if (error) throw error;
    linhas.push(...data);
    if (data.length < TAMANHO_PAGINA) return linhas;
  }
}

// { [titulo_id]: 'YYYY-MM-DD' } com a data do último pagamento de cada título.
async function carregarUltimosPagamentos(supabase, idsTitulos) {
  const lotes = [];
  for (let i = 0; i < idsTitulos.length; i += TAMANHO_LOTE) {
    lotes.push(idsTitulos.slice(i, i + TAMANHO_LOTE));
  }

  const resultados = await Promise.all(
    lotes.map((lote) =>
      buscarTudo(() =>
        supabase
          .from('pagamentos')
          .select('id, titulo_id, data_pagamento')
          .in('titulo_id', lote)
          .order('id')
      )
    )
  );

  const ultimo = {};
  for (const pagamento of resultados.flat()) {
    const atual = ultimo[pagamento.titulo_id];
    if (!atual || pagamento.data_pagamento > atual) {
      ultimo[pagamento.titulo_id] = pagamento.data_pagamento;
    }
  }
  return ultimo;
}

// Calcula o risco de todos os clientes (ou só de `clienteId`, se informado).
// Devolve { riscoDe, titulos, config, erro }: riscoDe(clienteId) dá o risco do
// cliente, ou null se algo falhou (erro traz a mensagem). `titulos` e `config`
// são o que foi lido do banco, pra tela "Hoje" não precisar ler de novo. Uma
// falha aqui não deve derrubar a tela: quem chama mostra o aviso e segue.
export async function carregarRiscos(supabase, { clienteId } = {}) {
  try {
    const { data: config, error: erroConfig } = await supabase
      .from('configuracoes')
      .select('*')
      .eq('id', 1)
      .single();
    if (erroConfig) throw erroConfig;

    const titulos = await buscarTudo(() => {
      const consulta = supabase
        .from('titulos_com_saldo')
        .select('id, cliente_id, data_vencimento, status, dias_atraso, valor_restante')
        .order('id');
      return clienteId ? consulta.eq('cliente_id', clienteId) : consulta;
    });

    // Só os títulos já quitados precisam da data de pagamento (pra saber se
    // foram pagos em dia).
    const idsQuitados = titulos.filter((t) => t.status === 'pago').map((t) => t.id);
    const ultimoPagamento = await carregarUltimosPagamentos(supabase, idsQuitados);

    const titulosPorCliente = new Map();
    for (const titulo of titulos) {
      const lista = titulosPorCliente.get(titulo.cliente_id) || [];
      lista.push(titulo);
      titulosPorCliente.set(titulo.cliente_id, lista);
    }

    const riscos = new Map();
    for (const [id, lista] of titulosPorCliente) {
      riscos.set(id, calcularRisco(lista, ultimoPagamento, config));
    }

    return {
      // Cliente sem nenhum título não aparece em `riscos`: calcula como "sem compras".
      riscoDe: (id) => riscos.get(id) || calcularRisco([], ultimoPagamento, config),
      titulos,
      config,
      erro: null,
    };
  } catch (e) {
    return { riscoDe: () => null, titulos: [], config: null, erro: e.message || 'erro desconhecido' };
  }
}
