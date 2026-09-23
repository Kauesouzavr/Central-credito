import { Suspense } from 'react';
import { getSupabaseServerClient } from '../../lib/supabase-server';
import { carregarClientes } from '../../lib/carregar-clientes';
import { ListaClientes } from '../componentes/clientes/ListaClientes';
import { NovoClienteModal } from '../componentes/clientes/NovoClienteModal';

export const dynamic = 'force-dynamic';

export default async function Clientes() {
  const supabase = getSupabaseServerClient();
  const { clientes, erro } = await carregarClientes(supabase);

  return (
    <div>
      {erro ? (
        <p className="rounded-2xl bg-brand-50 px-5 py-4 font-semibold text-brand-700 ring-1 ring-brand-200">
          Erro ao carregar clientes: {erro}
        </p>
      ) : (
        <ListaClientes clientes={clientes} />
      )}
      <Suspense fallback={null}>
        <NovoClienteModal />
      </Suspense>
    </div>
  );
}
