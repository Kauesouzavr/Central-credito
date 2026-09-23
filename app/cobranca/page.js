import { getSupabaseServerClient } from '../../lib/supabase-server';
import { carregarRegua } from '../../lib/carregar-regua';
import { PageHeader } from '../componentes/ui/PageHeader';
import { ReguaTimeline } from '../componentes/regua/ReguaTimeline';
import { MensagemFeed } from '../componentes/regua/MensagemFeed';
import { ConexaoWhatsApp } from '../componentes/regua/ConexaoWhatsApp';
import { PausarEnviosButton } from '../componentes/regua/PausarEnviosButton';

export const dynamic = 'force-dynamic';

export default async function Cobranca() {
  const supabase = getSupabaseServerClient();
  const { config, mensagens, enviadasHoje, nestaHora, erro } = await carregarRegua(supabase);

  return (
    <div>
      <PageHeader
        title="Cobrança automática"
        subtitle="As mensagens saem sozinhas pelo WhatsApp, com textos variados, sem precisar aprovar."
        actions={config && <PausarEnviosButton pausado={config.whatsapp_pausado} />}
      />

      {erro && (
        <p className="mb-6 rounded-2xl bg-brand-50 px-5 py-4 font-semibold text-brand-700 ring-1 ring-brand-200">
          Não foi possível carregar a régua: {erro}
        </p>
      )}

      {config && (
        <>
          <ReguaTimeline config={config} />

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
            <MensagemFeed mensagens={mensagens} />
            <ConexaoWhatsApp config={config} enviadasHoje={enviadasHoje} nestaHora={nestaHora} />
          </div>
        </>
      )}
    </div>
  );
}
