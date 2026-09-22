import Link from 'next/link';
import { getSupabaseServerClient } from '../lib/supabase-server';
import { carregarHoje } from '../lib/carregar-hoje';
import { diasEntre, formatarData, formatarMoeda, hojeBrasil, plural } from '../lib/util';
import BotaoAcao from './componentes/BotaoAcao';
import EtiquetaRisco from './componentes/EtiquetaRisco';
import { desfazerCobranca, registrarCobranca } from './actions';

export const dynamic = 'force-dynamic';

function quandoCobrado(data, hoje) {
  const dias = diasEntre(data, hoje);
  if (dias <= 0) return 'hoje';
  if (dias === 1) return 'ontem';
  return `há ${dias} dias`;
}

function textoAtraso(dias) {
  return `atrasado há ${dias} ${plural(dias, 'dia', 'dias')}`;
}

export default async function Home({ searchParams }) {
  const { ok, erro } = (await searchParams) || {};

  const hoje = hojeBrasil();
  const supabase = getSupabaseServerClient();
  const { resumo, erro: erroHoje } = await carregarHoje(supabase);

  const semPendencias = resumo && resumo.fila.length === 0 && resumo.vencemHoje.length === 0;

  return (
    <main className="pagina">
      <div className="cabecalho">
        <h1>Hoje, {formatarData(hoje)}</h1>
        <Link href="/clientes/novo" className="botao">
          + Novo cliente
        </Link>
      </div>

      <form action="/clientes" method="get" className="busca">
        <label>
          Buscar cliente pelo nome
          <input
            type="search"
            name="busca"
            placeholder="ex: Maria"
            autoComplete="off"
            autoFocus
          />
        </label>
        <button type="submit">Buscar</button>
      </form>

      {ok && <p className="sucesso">{ok}</p>}
      {erro && <p className="erro">{erro}</p>}
      {erroHoje && <p className="erro">Não foi possível carregar o resumo de hoje: {erroHoje}</p>}

      {resumo && (
        <>
          <div className="cartoes">
            <div className="cartao">
              <p className="cartao-numero">{formatarMoeda(resumo.totalVencido)}</p>
              <p className="cartao-rotulo">Total vencido em aberto</p>
            </div>
            <div className="cartao">
              <p className="cartao-numero">{resumo.clientesAtencao}</p>
              <p className="cartao-rotulo">
                {plural(resumo.clientesAtencao, 'cliente precisa', 'clientes precisam')} de atenção hoje
              </p>
            </div>
            <div className="cartao">
              <p className="cartao-numero">{resumo.nuncaCobrados}</p>
              <p className="cartao-rotulo">
                {plural(resumo.nuncaCobrados, 'atrasado nunca foi cobrado', 'atrasados nunca foram cobrados')}
              </p>
            </div>
            <div className="cartao">
              <p className="cartao-numero">
                {resumo.atrasoMaisAntigo > 0
                  ? `${resumo.atrasoMaisAntigo} ${plural(resumo.atrasoMaisAntigo, 'dia', 'dias')}`
                  : '—'}
              </p>
              <p className="cartao-rotulo">Atraso mais antigo</p>
            </div>
            <div className="cartao">
              <p className="cartao-numero">{formatarMoeda(resumo.aVencer30Dias)}</p>
              <p className="cartao-rotulo">A vencer nos próximos 30 dias</p>
            </div>
          </div>

          {resumo.maiorRisco && (
            <section className="caixa-risco">
              <h3>Maior risco agora</h3>
              <p>
                <Link href={`/clientes/${resumo.maiorRisco.cliente.id}`}>
                  <strong>{resumo.maiorRisco.cliente.nome}</strong>
                </Link>{' '}
                <EtiquetaRisco risco={resumo.maiorRisco.risco} /> Nota{' '}
                {Math.floor(resumo.maiorRisco.risco.nota)} de 100
              </p>
              <ul>
                {resumo.maiorRisco.risco.motivos.map((motivo) => (
                  <li key={motivo}>{motivo}</li>
                ))}
              </ul>
              <p>
                Em aberto: <strong>{formatarMoeda(resumo.maiorRisco.emAberto)}</strong>
              </p>
            </section>
          )}

          {semPendencias && (
            <p className="sucesso">
              {resumo.cobradosRecentemente.length > 0
                ? 'Todos os atrasados já foram cobrados e nada vence hoje.'
                : 'Nada atrasado e nada vencendo hoje.'}
            </p>
          )}

          {resumo.fila.length > 0 && (
            <>
              <h3>Fila de cobrança de hoje ({resumo.fila.length})</h3>
              <ul className="lista-clientes fila">
                {resumo.fila.map((linha) => (
                  <li key={linha.cliente.id}>
                    <Link href={`/clientes/${linha.cliente.id}`}>
                      <strong>{linha.cliente.nome}</strong> — {linha.cliente.telefone}
                      <span className="linha-risco">
                        <EtiquetaRisco risco={linha.risco} />
                        {formatarMoeda(linha.totalAtrasado)} · {textoAtraso(linha.maiorAtraso)}
                        {linha.titulosAtrasados > 1 ? ` · ${linha.titulosAtrasados} títulos` : ''}
                        {linha.ultimaCobranca
                          ? ` · última cobrança ${quandoCobrado(linha.ultimaCobranca, hoje)}`
                          : ' · nunca cobrado'}
                      </span>
                    </Link>
                    <form action={registrarCobranca}>
                      <input type="hidden" name="cliente_id" value={linha.cliente.id} />
                      <BotaoAcao
                        className="botao-secundario"
                        confirmar={`Registrar que você já cobrou ${linha.cliente.nome}? Esse cliente sai da fila por ${resumo.diasRepetirCobranca} ${plural(resumo.diasRepetirCobranca, 'dia', 'dias')}.`}
                      >
                        Já cobrei
                      </BotaoAcao>
                    </form>
                  </li>
                ))}
              </ul>
            </>
          )}

          {resumo.vencemHoje.length > 0 && (
            <>
              <h3>Vencem hoje ({resumo.vencemHoje.length})</h3>
              <ul className="lista-clientes">
                {resumo.vencemHoje.map((linha) => (
                  <li key={linha.cliente.id}>
                    <Link href={`/clientes/${linha.cliente.id}`}>
                      <strong>{linha.cliente.nome}</strong> — {linha.cliente.telefone}
                      <span className="linha-risco">
                        <EtiquetaRisco risco={linha.risco} />
                        {formatarMoeda(linha.total)} vence hoje
                        {linha.titulos > 1 ? ` (${linha.titulos} títulos)` : ''}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}

          {resumo.cobradosRecentemente.length > 0 && (
            <details className="cobrados">
              <summary>
                Já cobrados nos últimos {resumo.diasRepetirCobranca}{' '}
                {plural(resumo.diasRepetirCobranca, 'dia', 'dias')} ({resumo.cobradosRecentemente.length})
              </summary>
              <ul className="lista-clientes fila">
                {resumo.cobradosRecentemente.map((linha) => (
                  <li key={linha.cliente.id}>
                    <Link href={`/clientes/${linha.cliente.id}`}>
                      <strong>{linha.cliente.nome}</strong> — cobrado{' '}
                      {quandoCobrado(linha.cobranca.data, hoje)}
                      <span className="linha-risco">
                        {formatarMoeda(linha.totalAtrasado)} · {textoAtraso(linha.maiorAtraso)}
                      </span>
                    </Link>
                    {linha.cobranca.podeDesfazer && (
                      <form action={desfazerCobranca}>
                        <input type="hidden" name="cobranca_id" value={linha.cobranca.id} />
                        <BotaoAcao
                          className="botao-secundario"
                          confirmar={`Desfazer a cobrança de ${linha.cliente.nome}? O cliente volta para a fila.`}
                        >
                          Desfazer
                        </BotaoAcao>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </main>
  );
}
