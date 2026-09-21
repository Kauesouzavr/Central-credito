import Link from 'next/link';
import { getSupabaseServerClient } from '../../../../lib/supabase-server';
import { FORMAS_PAGAMENTO } from '../../../../lib/util';
import BotaoAcao from '../../../componentes/BotaoAcao';
import { adicionarCompra } from './actions';

export const dynamic = 'force-dynamic';

export default async function NovaCompra({ params, searchParams }) {
  const { id } = await params;
  const { erro } = (await searchParams) || {};

  const supabase = getSupabaseServerClient();
  const { data: cliente } = await supabase
    .from('clientes')
    .select('id, nome')
    .eq('id', id)
    .single();

  if (!cliente) {
    return (
      <main className="pagina">
        <p className="erro">Cliente não encontrado.</p>
        <Link href="/clientes">← Voltar pra lista</Link>
      </main>
    );
  }

  return (
    <main className="pagina">
      <Link href={`/clientes/${cliente.id}`}>← Voltar pra ficha de {cliente.nome}</Link>

      <h1>Nova compra</h1>
      <p>Cliente: {cliente.nome}</p>

      {erro && <p className="erro">{erro}</p>}

      <form action={adicionarCompra} className="formulario">
        <input type="hidden" name="cliente_id" value={cliente.id} />

        <label>
          Produto *
          <input type="text" name="produto" required placeholder="ex: Sapato social preto" />
        </label>

        <label>
          Valor (R$) *
          <input type="number" name="valor" required min="0.01" step="0.01" />
        </label>

        <label>
          Data de vencimento *
          <input type="date" name="data_vencimento" required />
        </label>

        <label>
          Forma de pagamento *
          <select name="forma_pagamento" required defaultValue="">
            <option value="" disabled>
              Selecione
            </option>
            {FORMAS_PAGAMENTO.map((forma) => (
              <option key={forma} value={forma}>
                {forma}
              </option>
            ))}
          </select>
        </label>

        <BotaoAcao>Salvar compra</BotaoAcao>
      </form>
    </main>
  );
}
