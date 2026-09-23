import Link from 'next/link';
import { getSupabaseServerClient } from '../../lib/supabase-server';
import { carregarPrevisao } from '../../lib/carregar-previsao';
import { formatarMoeda } from '../../lib/util';
import { GlassPanel } from '../componentes/ui/GlassPanel';
import { PageHeader } from '../componentes/ui/PageHeader';
import { RiskBadge } from '../componentes/ui/RiskBadge';
import { ForecastChart } from '../componentes/previsao/ForecastChart';

export const dynamic = 'force-dynamic';

export default async function Previsao() {
  const supabase = getSupabaseServerClient();
  const { resumo, erro } = await carregarPrevisao(supabase);

  const pctEntra = resumo && resumo.total.saldo > 0 ? Math.round((resumo.total.previsto / resumo.total.saldo) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Previsão de caixa"
        subtitle="O que deve entrar nas próximas 4 semanas, já descontando o risco de cada cliente."
      />

      {erro && (
        <p className="mb-6 rounded-2xl bg-brand-50 px-5 py-4 font-semibold text-brand-700 ring-1 ring-brand-200">
          Não foi possível calcular a previsão: {erro}
        </p>
      )}

      {resumo && (
        <>
          <section aria-label="Totais da previsão" className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
            <GlassPanel strong className="p-7">
              <p className="text-base font-semibold text-ink-soft">Previsão ajustada</p>
              <p className="mt-1 text-5xl font-extrabold tracking-tight tabular-nums text-brand-700 md:text-6xl">
                {formatarMoeda(resumo.total.previsto)}
              </p>
              <p className="mt-3 text-lg text-ink-soft">
                É o que deve realmente entrar: <strong className="text-ink">{pctEntra}%</strong> do que está em aberto.
              </p>
            </GlassPanel>
            <div className="px-1 pb-2">
              <p className="text-base font-medium text-ink-soft">Soma dos vencimentos</p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums text-ink">{formatarMoeda(resumo.total.saldo)}</p>
              <p className="text-sm text-ink-faint">se todo mundo pagasse em dia</p>
            </div>
            <div className="px-1 pb-2">
              <p className="text-base font-medium text-ink-soft">Diferença</p>
              <p className="mt-1 text-3xl font-extrabold tabular-nums text-brand-700">− {formatarMoeda(resumo.total.diferenca)}</p>
              <p className="text-sm text-ink-faint">provavelmente não entra no prazo</p>
            </div>
          </section>

          <GlassPanel as="section" aria-labelledby="grafico-titulo" className="mt-10 p-5 sm:p-7">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <h2 id="grafico-titulo" className="text-2xl font-extrabold tracking-tight text-ink">
                Semana a semana
              </h2>
              <ul className="flex flex-wrap gap-5 text-base text-ink-soft">
                <li className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded bg-brand-100 ring-1 ring-brand-200" aria-hidden="true" /> Vence
                </li>
                <li className="flex items-center gap-2">
                  <span className="bar-fill h-3.5 w-3.5 rounded" aria-hidden="true" /> Deve entrar
                </li>
              </ul>
            </div>
            <ForecastChart periodos={resumo.periodos} />
            <p className="mt-3 text-sm text-ink-faint">
              "Já vencidos" inclui tudo o que já passou do prazo. As semanas seguintes contam a partir de hoje.
            </p>
          </GlassPanel>

          <GlassPanel as="section" aria-labelledby="clientes-previsao" className="mt-10 overflow-hidden p-2 sm:p-3">
            <h2 id="clientes-previsao" className="px-4 pb-2 pt-4 text-2xl font-extrabold tracking-tight text-ink">
              Por cliente
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="text-sm font-bold text-ink-faint">
                    <th scope="col" className="px-4 py-3">Cliente</th>
                    <th scope="col" className="px-4 py-3 text-right">Em aberto</th>
                    <th scope="col" className="px-4 py-3">Risco</th>
                    <th scope="col" className="px-4 py-3">Chance de pagar</th>
                    <th scope="col" className="px-4 py-3 text-right">Deve entrar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/80">
                  {resumo.clientes.map(({ cliente, risco, probabilidade, saldo, previsto }) => (
                    <tr key={cliente.id} className="text-base">
                      <td className="px-4 py-4">
                        <Link
                          href={`/clientes/${cliente.id}`}
                          className="rounded-lg text-lg font-bold text-ink hover:text-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
                        >
                          {cliente.nome}
                        </Link>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold tabular-nums text-ink">{formatarMoeda(saldo)}</td>
                      <td className="px-4 py-4">
                        <RiskBadge nivel={risco.nivel} nota={risco.nota} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-28 overflow-hidden rounded-full bg-line" aria-hidden="true">
                            <div className="bar-fill h-full rounded-full" style={{ width: `${probabilidade * 100}%` }} />
                          </div>
                          <span className="font-bold tabular-nums text-ink">{Math.round(probabilidade * 100)}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right text-lg font-extrabold tabular-nums text-ink">{formatarMoeda(previsto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassPanel>
        </>
      )}
    </div>
  );
}
