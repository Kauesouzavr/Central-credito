import { DownloadIcon } from 'lucide-react';
import { getSupabaseServerClient } from '../../lib/supabase-server';
import { carregarRelatorio } from '../../lib/carregar-relatorio';
import { carregarHoje } from '../../lib/carregar-hoje';
import { carregarPrevisao } from '../../lib/carregar-previsao';
import { carregarClientes } from '../../lib/carregar-clientes';
import { gerarRelatorioTexto } from '../../lib/relatorio-texto';
import { formatarMoeda } from '../../lib/util';
import { GlassPanel } from '../componentes/ui/GlassPanel';
import { PageHeader } from '../componentes/ui/PageHeader';
import { CopyReportButton } from '../componentes/relatorio/CopyReportButton';

export const dynamic = 'force-dynamic';

export default async function Relatorio() {
  const supabase = getSupabaseServerClient();
  const [{ resumo: relatorio, erro: erroRelatorio }, { resumo: hoje, erro: erroHoje }, { resumo: previsao, erro: erroPrevisao }, { clientes, erro: erroClientes }] =
    await Promise.all([
      carregarRelatorio(supabase),
      carregarHoje(supabase),
      carregarPrevisao(supabase),
      carregarClientes(supabase),
    ]);

  const erro = erroRelatorio || erroHoje || erroPrevisao || erroClientes;

  const relatorioTexto =
    !erro &&
    gerarRelatorioTexto({
      relatorio,
      totalVencido: hoje.totalVencido,
      esperado: previsao.total.previsto,
      clientesAtrasados: clientes.filter((c) => c.atrasoMaximo > 0).length,
      nomesRiscoAlto: clientes.filter((c) => c.risco.nivel === 'alto' && c.valorAberto > 0).map((c) => c.nome),
    });

  return (
    <div>
      <PageHeader
        title="Relatório da semana"
        subtitle={relatorioTexto ? `Resumo automático de ${relatorioTexto.periodo}.` : undefined}
        actions={
          relatorioTexto && (
            <>
              <a href="/api/exportar-csv" className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl px-6 text-lg font-bold btn-secondary-surface text-ink hover:text-brand-700">
                <DownloadIcon className="h-5 w-5" aria-hidden="true" />
                Exportar planilha
              </a>
              <CopyReportButton texto={relatorioTexto.texto} />
            </>
          )
        }
      />

      {erro && (
        <p className="rounded-2xl bg-brand-50 px-5 py-4 font-semibold text-brand-700 ring-1 ring-brand-200">
          Não foi possível carregar o relatório: {erro}
        </p>
      )}

      {relatorioTexto && (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
          <GlassPanel strong as="article" aria-label="Texto do relatório" className="p-7 sm:p-10">
            <div className="max-w-2xl space-y-5">
              {relatorioTexto.paragrafos.map((p, i) => (
                <p key={i} className={i === 0 ? 'text-2xl font-extrabold tracking-tight text-ink' : 'text-xl leading-relaxed text-ink'}>
                  {p}
                </p>
              ))}
            </div>
          </GlassPanel>

          <dl className="divide-y divide-line">
            <div className="pb-5">
              <dt className="text-base text-ink-soft">Entrou na semana</dt>
              <dd className="text-3xl font-extrabold tabular-nums text-ok-700">{formatarMoeda(relatorioTexto.numeros.entrou)}</dd>
              <dd className="text-sm text-ink-faint">{relatorioTexto.numeros.qtdPagamentos} pagamentos</dd>
            </div>
            <div className="py-5">
              <dt className="text-base text-ink-soft">Vencido em aberto</dt>
              <dd className="text-3xl font-extrabold tabular-nums text-brand-700">{formatarMoeda(relatorioTexto.numeros.vencido)}</dd>
              <dd className="text-sm text-ink-faint">{relatorioTexto.numeros.clientesAtrasados} clientes em atraso</dd>
            </div>
            <div className="py-5">
              <dt className="text-base text-ink-soft">Esperado em 4 semanas</dt>
              <dd className="text-3xl font-extrabold tabular-nums text-ink">{formatarMoeda(relatorioTexto.numeros.esperado)}</dd>
            </div>
            <div className="pt-5">
              <dt className="text-base text-ink-soft">Decisões tomadas</dt>
              <dd className="text-3xl font-extrabold tabular-nums text-ink">{relatorioTexto.numeros.decisoes}</dd>
              <dd className="text-sm text-ink-faint">pagamentos e compras lançados</dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}
