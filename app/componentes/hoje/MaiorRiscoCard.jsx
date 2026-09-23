import Link from 'next/link';
import { ArrowRightIcon } from 'lucide-react';
import { classesBotao } from '../../../lib/buttonStyles';
import { formatarMoeda } from '../../../lib/util';
import { ROTULO_NIVEL } from '../../../lib/risco-ui';
import { GlassPanel } from '../ui/GlassPanel';
import { RiskRing } from '../ui/RiskRing';

// `destaque` = { cliente: {id, nome}, risco: {nota, nivel, motivos}, emAberto, maiorAtraso }
// (formato de `resumo.maiorRisco` de lib/hoje.js).
export function MaiorRiscoCard({ destaque }) {
  const { cliente, risco, emAberto } = destaque;
  return (
    <GlassPanel strong as="section" aria-labelledby="maior-risco-titulo" className="p-6 lg:p-7">
      <p className="text-sm font-bold text-brand-700">Maior risco agora</p>
      <div className="mt-4 flex items-center gap-4">
        <RiskRing nota={risco.nota} nivel={risco.nivel} size={76} />
        <div className="min-w-0">
          <h2 id="maior-risco-titulo" className="text-2xl font-extrabold leading-tight tracking-tight text-ink">
            {cliente.nome}
          </h2>
          <p className="mt-0.5 text-base text-ink-soft">{ROTULO_NIVEL[risco.nivel]}</p>
        </div>
      </div>
      <p className="mt-5 text-lg leading-relaxed text-ink">{risco.motivos.join(' ')}</p>
      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4">
        <div>
          <dt className="text-sm text-ink-faint">Em aberto</dt>
          <dd className="text-xl font-extrabold tabular-nums text-ink">{formatarMoeda(emAberto)}</dd>
        </div>
        <div>
          <dt className="text-sm text-ink-faint">Maior atraso</dt>
          <dd className="text-xl font-extrabold tabular-nums text-ink">{destaque.maiorAtraso} dias</dd>
        </div>
      </dl>
      <Link href={`/clientes/${cliente.id}`} className={classesBotao('primary', 'lg', 'mt-6 w-full')}>
        Abrir ficha
        <ArrowRightIcon className="h-5 w-5" aria-hidden="true" />
      </Link>
    </GlassPanel>
  );
}
