import Link from 'next/link';
import { getSupabaseServerClient } from '../lib/supabase-server';
import { carregarHoje } from '../lib/carregar-hoje';
import { formatarDiaSemana, formatarMoeda, formatarMoedaCurta, hojeBrasil, plural } from '../lib/util';
import { PageHeader } from './componentes/ui/PageHeader';
import { GlassPanel } from './componentes/ui/GlassPanel';
import { RiskBadge } from './componentes/ui/RiskBadge';
import { QuietMetric } from './componentes/hoje/QuietMetric';
import { RiskThermometer } from './componentes/hoje/RiskThermometer';
import { MaiorRiscoCard } from './componentes/hoje/MaiorRiscoCard';
import { FilaCobranca } from './componentes/hoje/FilaCobranca';
import { classesBotao } from '../lib/buttonStyles';
import BotaoAcao from './componentes/BotaoAcao';
import { desfazerCobranca } from './actions';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const hoje = hojeBrasil();
  const supabase = getSupabaseServerClient();
  const { resumo, erro: erroHoje } = await carregarHoje(supabase);

  return (
    <div>
      <PageHeader eyebrow={formatarDiaSemana(hoje)} title="Hoje" />

      {erroHoje && (
        <p className="mb-6 rounded-2xl bg-brand-50 px-5 py-4 font-semibold text-brand-700 ring-1 ring-brand-200">
          Não foi possível carregar o resumo de hoje: {erroHoje}
        </p>
      )}

      {resumo && (
        <>
          <section
            aria-label="Resumo do dia"
            className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)_minmax(0,1fr)] lg:gap-14"
          >
            <dl className="order-2 grid grid-cols-2 gap-x-6 lg:order-1 lg:block lg:divide-y lg:divide-line lg:text-right">
              <QuietMetric label="Precisam de atenção hoje" value={`${resumo.clientesAtencao} clientes`} />
              <QuietMetric
                label="Nunca foram cobrados"
                value={resumo.nuncaCobrados}
                hint="têm saldo e nenhuma cobrança"
              />
              <QuietMetric
                label="Atraso mais antigo"
                value={resumo.atrasoMaisAntigo > 0 ? `${resumo.atrasoMaisAntigo} dias` : '—'}
                hint={resumo.atrasoMaisAntigoCliente}
              />
              <QuietMetric label="A vencer em 30 dias" value={formatarMoedaCurta(resumo.aVencer30Dias)} />
            </dl>

            <div className="order-1 lg:order-2">
              <RiskThermometer vencido={resumo.totalVencido} totalAberto={resumo.totalAberto} />
            </div>

            <div className="order-3">
              {resumo.maiorRisco ? (
                <MaiorRiscoCard destaque={resumo.maiorRisco} />
              ) : (
                <GlassPanel className="p-7">
                  <p className="text-lg font-bold text-ink">Nenhum cliente em risco</p>
                  <p className="mt-1 text-ink-soft">Todos estão em dia com os pagamentos.</p>
                </GlassPanel>
              )}
            </div>
          </section>

          <FilaCobranca itens={resumo.fila} diasRepetirCobranca={resumo.diasRepetirCobranca} className="mt-14" />

          {resumo.vencemHoje.length > 0 && (
            <GlassPanel as="section" aria-label="Vencem hoje" className="mt-8 p-3 sm:p-4">
              <h2 className="px-3 pb-3 pt-3 text-xl font-extrabold tracking-tight text-ink sm:px-4">
                Vencem hoje
                <span className="ml-3 text-lg font-bold tabular-nums text-ink-faint">{resumo.vencemHoje.length}</span>
              </h2>
              <ul className="divide-y divide-line/80">
                {resumo.vencemHoje.map((linha) => (
                  <li key={linha.cliente.id}>
                    <Link
                      href={`/clientes/${linha.cliente.id}`}
                      className="flex items-center justify-between gap-4 rounded-2xl px-3 py-4 transition-colors duration-150 hover:bg-white/80 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 sm:px-4"
                    >
                      <span className="min-w-0 flex-1 truncate text-lg font-bold text-ink">{linha.cliente.nome}</span>
                      <RiskBadge nivel={linha.risco.nivel} nota={linha.risco.nota} className="hidden sm:inline-flex" />
                      <span className="text-lg font-extrabold tabular-nums text-ink">
                        {formatarMoeda(linha.total)}
                        {linha.titulos > 1 ? ` · ${linha.titulos} títulos` : ''}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </GlassPanel>
          )}

          {resumo.cobradosRecentemente.length > 0 && (
            <details className="mt-8">
              <summary className="cursor-pointer text-base font-bold text-brand-700">
                Já cobrados nos últimos {resumo.diasRepetirCobranca} {plural(resumo.diasRepetirCobranca, 'dia', 'dias')} (
                {resumo.cobradosRecentemente.length})
              </summary>
              <GlassPanel as="ul" className="mt-3 divide-y divide-line/80 p-3 sm:p-4">
                {resumo.cobradosRecentemente.map((linha) => (
                  <li key={linha.cliente.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-4 sm:px-4">
                    <Link
                      href={`/clientes/${linha.cliente.id}`}
                      className="min-w-0 flex-1 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
                    >
                      <span className="block truncate text-lg font-bold text-ink">{linha.cliente.nome}</span>
                      <span className="text-base text-ink-soft">
                        {formatarMoeda(linha.totalAtrasado)} · atrasado há {linha.maiorAtraso}{' '}
                        {plural(linha.maiorAtraso, 'dia', 'dias')}
                      </span>
                    </Link>
                    {linha.cobranca.podeDesfazer && (
                      <form action={desfazerCobranca}>
                        <input type="hidden" name="cobranca_id" value={linha.cobranca.id} />
                        <BotaoAcao
                          className={classesBotao('ghost', 'sm')}
                          confirmar={`Desfazer a cobrança de ${linha.cliente.nome}? O cliente volta para a fila.`}
                        >
                          Desfazer
                        </BotaoAcao>
                      </form>
                    )}
                  </li>
                ))}
              </GlassPanel>
            </details>
          )}
        </>
      )}
    </div>
  );
}
