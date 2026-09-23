import { getSupabaseServerClient } from '../../lib/supabase-server';
import { carregarRiscos } from '../../lib/carregar-risco';
import { PageHeader } from '../componentes/ui/PageHeader';
import { AjustesInterativo } from '../componentes/ajustes/AjustesInterativo';

export const dynamic = 'force-dynamic';

export default async function Ajustes() {
  const supabase = getSupabaseServerClient();
  const { config, titulosPorCliente, ultimoPagamento, erro } = await carregarRiscos(supabase);

  const clientesTitulos = config ? [...titulosPorCliente].map(([id, titulos]) => ({ id, titulos })) : [];

  return (
    <div>
      <PageHeader
        title="Ajustes"
        subtitle="Os números que decidem quem é risco e quando cada mensagem sai. Mude com calma — dá para desfazer antes de salvar."
      />

      {erro && (
        <p className="mb-6 rounded-2xl bg-brand-50 px-5 py-4 font-semibold text-brand-700 ring-1 ring-brand-200">
          Não foi possível carregar os ajustes: {erro}
        </p>
      )}

      {config && <AjustesInterativo config={config} clientesTitulos={clientesTitulos} ultimoPagamento={ultimoPagamento} />}
    </div>
  );
}
