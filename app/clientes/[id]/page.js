import Link from 'next/link';
import { getSupabaseServerClient } from '../../../lib/supabase-server';
import { carregarRiscos } from '../../../lib/carregar-risco';
import { hojeBrasil } from '../../../lib/util';
import { GlassPanel } from '../../componentes/ui/GlassPanel';
import { FichaInterativa } from '../../componentes/ficha/FichaInterativa';

export const dynamic = 'force-dynamic';

export default async function FichaCliente({ params }) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();

  const { data: cliente, error: erroCliente } = await supabase.from('clientes').select('*').eq('id', id).single();

  if (erroCliente || !cliente) {
    return (
      <GlassPanel className="mx-auto max-w-lg p-10 text-center">
        <p className="text-2xl font-extrabold text-ink">Cliente não encontrado</p>
        <p className="mt-2 text-ink-soft">Ele pode ter sido removido ou o endereço está errado.</p>
        <Link href="/clientes" className="mt-6 inline-block font-bold text-brand-700 hover:text-brand-800">
          Voltar para clientes
        </Link>
      </GlassPanel>
    );
  }

  const { data: titulosBrutos, error: erroTitulos } = await supabase
    .from('titulos_com_saldo')
    .select('*')
    .eq('cliente_id', id)
    .order('data_vencimento', { ascending: true });

  const idsTitulos = (titulosBrutos || []).map((t) => t.id);
  const { data: pagamentosBrutos } =
    idsTitulos.length > 0
      ? await supabase
          .from('pagamentos')
          .select('*')
          .in('titulo_id', idsTitulos)
          .order('data_pagamento', { ascending: false })
      : { data: [] };

  const pagamentosPorTitulo = new Map();
  for (const p of pagamentosBrutos || []) {
    const lista = pagamentosPorTitulo.get(p.titulo_id) || [];
    lista.push(p);
    pagamentosPorTitulo.set(p.titulo_id, lista);
  }
  const titulos = (titulosBrutos || []).map((t) => ({ ...t, pagamentos: pagamentosPorTitulo.get(t.id) || [] }));

  const { data: mensagens } = await supabase
    .from('mensagens')
    .select('*')
    .eq('cliente_id', id)
    .order('criado_em', { ascending: false })
    .limit(20);

  const { riscoDe, erro: erroRisco } = await carregarRiscos(supabase, { clienteId: id });
  const risco = riscoDe(id) || { nota: 0, nivel: 'baixo', motivos: [] };

  return (
    <div>
      {erroTitulos && (
        <p className="mb-6 rounded-2xl bg-brand-50 px-5 py-4 font-semibold text-brand-700 ring-1 ring-brand-200">
          Erro ao carregar títulos: {erroTitulos.message}
        </p>
      )}
      {erroRisco && (
        <p className="mb-6 rounded-2xl bg-brand-50 px-5 py-4 font-semibold text-brand-700 ring-1 ring-brand-200">
          Não foi possível calcular o risco: {erroRisco}
        </p>
      )}
      <FichaInterativa cliente={cliente} risco={risco} titulos={titulos} mensagens={mensagens || []} hoje={hojeBrasil()} />
    </div>
  );
}
