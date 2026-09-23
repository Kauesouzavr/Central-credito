import { buscarTudo, carregarRiscos } from './carregar-risco.js';
import { paraCentavos } from './util.js';

// Lê todos os clientes com o risco já calculado e um resumo das compras em
// aberto de cada um (quantas, maior atraso, saldo) — pronto pra lista de
// clientes (busca/filtro são feitos no cliente, dataset pequeno) e pra
// prévia de risco da tela de Ajustes.
export async function carregarClientes(supabase) {
  try {
    const { riscoDe, titulos, erro } = await carregarRiscos(supabase);
    if (erro) throw new Error(erro);

    const clientesBrutos = await buscarTudo(() =>
      supabase.from('clientes').select('id, nome, telefone, segmento').order('nome', { ascending: true })
    );

    const porCliente = new Map();
    for (const t of titulos) {
      if (t.status === 'pago') continue;
      let situacao = porCliente.get(t.cliente_id);
      if (!situacao) {
        situacao = { titulosAbertos: 0, atrasoMaximo: 0, valorAbertoCentavos: 0 };
        porCliente.set(t.cliente_id, situacao);
      }
      situacao.titulosAbertos += 1;
      situacao.atrasoMaximo = Math.max(situacao.atrasoMaximo, Number(t.dias_atraso));
      situacao.valorAbertoCentavos += paraCentavos(t.valor_restante);
    }

    const clientes = clientesBrutos.map((cliente) => {
      const situacao = porCliente.get(cliente.id) || { titulosAbertos: 0, atrasoMaximo: 0, valorAbertoCentavos: 0 };
      return {
        ...cliente,
        risco: riscoDe(cliente.id),
        titulosAbertos: situacao.titulosAbertos,
        atrasoMaximo: situacao.atrasoMaximo,
        valorAberto: situacao.valorAbertoCentavos / 100,
      };
    });

    return { clientes, erro: null };
  } catch (e) {
    return { clientes: null, erro: e.message || 'erro desconhecido' };
  }
}
