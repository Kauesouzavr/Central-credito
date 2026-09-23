import Link from 'next/link';
import { ChevronRightIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { classesBotao } from '../../../lib/buttonStyles';
import { formatarMoeda, plural } from '../../../lib/util';
import { Avatar } from '../ui/Avatar';
import { GlassPanel } from '../ui/GlassPanel';
import { RiskBadge } from '../ui/RiskBadge';
import BotaoAcao from '../BotaoAcao';
import { registrarCobranca } from '../../actions';

// `itens` = resumo.fila de lib/hoje.js: [{cliente, risco, totalAtrasado,
// titulosAtrasados, maiorAtraso, ultimaCobranca}].
export function FilaCobranca({ itens, diasRepetirCobranca, className }) {
  return (
    <GlassPanel as="section" aria-labelledby="fila-titulo" className={twMerge('p-3 sm:p-4', className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-3 px-3 pb-3 pt-3 sm:px-4">
        <h2 id="fila-titulo" className="text-2xl font-extrabold tracking-tight text-ink">
          Fila de cobrança de hoje
          <span className="ml-3 text-lg font-bold tabular-nums text-ink-faint">{itens.length}</span>
        </h2>
        <Link
          href="/clientes"
          className="rounded-lg text-base font-bold text-brand-700 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
        >
          Ver todos os clientes
        </Link>
      </div>

      {itens.length === 0 ? (
        <p className="px-4 pb-6 pt-2 text-lg text-ink-soft">Ninguém para cobrar hoje. Tudo em dia.</p>
      ) : (
        <ul className="divide-y divide-line/80">
          {itens.map((linha) => (
            <li key={linha.cliente.id} className="group flex items-center gap-2 px-1">
              <Link
                href={`/clientes/${linha.cliente.id}`}
                className="flex min-w-0 flex-1 items-center gap-4 rounded-2xl px-2 py-4 transition-colors duration-150 hover:bg-white/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 sm:px-3"
              >
                <Avatar nome={linha.cliente.nome} nivel={linha.risco.nivel} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-bold text-ink">{linha.cliente.nome}</p>
                  <p className="truncate text-base text-ink-soft">
                    <span className="font-bold text-brand-700">
                      atrasado há {linha.maiorAtraso} {plural(linha.maiorAtraso, 'dia', 'dias')}
                    </span>
                    {linha.titulosAtrasados > 1 ? ` · ${linha.titulosAtrasados} títulos` : ''}
                  </p>
                </div>
                <div className="hidden w-48 text-sm text-ink-faint lg:block">
                  {linha.ultimaCobranca ? (
                    <span>última cobrança {linha.ultimaCobranca}</span>
                  ) : (
                    <span className="font-semibold text-warn-700">Nunca foi cobrado</span>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <span className="text-lg font-extrabold tabular-nums text-ink">{formatarMoeda(linha.totalAtrasado)}</span>
                  <RiskBadge nivel={linha.risco.nivel} nota={linha.risco.nota} className="hidden sm:inline-flex" />
                </div>
                <ChevronRightIcon
                  className="h-5 w-5 shrink-0 text-ink-faint transition-transform duration-150 group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
              <form action={registrarCobranca} className="shrink-0">
                <input type="hidden" name="cliente_id" value={linha.cliente.id} />
                <BotaoAcao
                  className={classesBotao('ghost', 'sm')}
                  confirmar={`Registrar que você já cobrou ${linha.cliente.nome}? Esse cliente sai da fila por ${diasRepetirCobranca} ${plural(diasRepetirCobranca, 'dia', 'dias')}.`}
                >
                  Já cobrei
                </BotaoAcao>
              </form>
            </li>
          ))}
        </ul>
      )}
    </GlassPanel>
  );
}
