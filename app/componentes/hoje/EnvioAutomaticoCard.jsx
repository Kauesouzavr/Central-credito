import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { classesBotao } from '../../../lib/buttonStyles';
import { plural } from '../../../lib/util';
import { GlassPanel } from '../ui/GlassPanel';

function listaDeNomes(nomes, clientesEnvolvidos) {
  if (nomes.length === 0) return '';
  const resto = clientesEnvolvidos - nomes.length;
  const texto = nomes.join(', ');
  return resto > 0 ? `${texto} e mais ${resto}` : texto;
}

// `envio` = { total, clientesEnvolvidos, nomes, ativo } (lib/carregar-envio-automatico.js).
export function EnvioAutomaticoCard({ envio }) {
  const { total, clientesEnvolvidos, nomes, ativo } = envio;
  const semNadaHoje = total === 0;

  return (
    <GlassPanel strong as="section" aria-labelledby="envio-automatico-titulo" className="p-6 lg:p-7">
      <div className="flex items-center gap-2">
        {ativo && !semNadaHoje && (
          <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ok-500 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-ok-500" />
          </span>
        )}
        <p className="text-sm font-bold text-brand-700">
          {ativo && !semNadaHoje ? 'Cobrança automática · ao vivo' : 'Cobrança automática'}
        </p>
      </div>

      {semNadaHoje ? (
        <h2 id="envio-automatico-titulo" className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-ink">
          Ninguém precisa ser cobrado hoje
        </h2>
      ) : (
        <h2 id="envio-automatico-titulo" className="mt-4 text-2xl font-extrabold leading-tight tracking-tight text-ink">
          {ativo
            ? `Hoje, ${total} ${plural(total, 'mensagem', 'mensagens')} ${plural(total, 'será', 'serão')} enviada${total === 1 ? '' : 's'} automaticamente`
            : `${total} ${plural(total, 'mensagem', 'mensagens')} de hoje ${plural(total, 'está', 'estão')} esperando`}
        </h2>
      )}

      {!semNadaHoje && (
        <p className="mt-2 text-base text-ink-soft">
          {nomes.length > 0 && `${listaDeNomes(nomes, clientesEnvolvidos)}. `}
          {ativo
            ? 'Sai sozinho pelo WhatsApp, sem precisar apertar nada.'
            : 'Envio automático está desligado ou pausado, precisa de aprovação em Cobrança.'}
        </p>
      )}

      <Link href="/cobranca" className={classesBotao('primary', 'lg', 'mt-6 w-full')}>
        Ver fila de cobrança
        <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
      </Link>
    </GlassPanel>
  );
}
