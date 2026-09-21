import Link from 'next/link';
import { getSupabaseServerClient } from '../../lib/supabase-server';
import { carregarPrevisao } from '../../lib/carregar-previsao';
import { formatarData, formatarMoeda } from '../../lib/util';
import EtiquetaRisco from '../componentes/EtiquetaRisco';

export const dynamic = 'force-dynamic';

// "21/09 a 27/09" (sem o ano, que é sempre o atual).
function intervalo(periodo) {
  if (!periodo.de) return 'atrasados';
  return `${formatarData(periodo.de).slice(0, 5)} a ${formatarData(periodo.ate).slice(0, 5)}`;
}

function percentual(parte, total) {
  return total > 0 ? Math.round((parte / total) * 100) : 0;
}

export default async function Previsao() {
  const supabase = getSupabaseServerClient();
  const { resumo, erro } = await carregarPrevisao(supabase);

  // Todas as barras usam a mesma escala: a do período com mais dinheiro a receber.
  const maximo = resumo ? Math.max(...resumo.periodos.map((p) => p.saldo)) : 0;

  return (
    <main className="pagina">
      <Link href="/">← Voltar</Link>

      <h1>Previsão de caixa</h1>

      {erro && <p className="erro">Não foi possível carregar a previsão: {erro}</p>}

      {resumo && (
        <>
          <p>
            Do que já venceu até {formatarData(resumo.janela.ate)} (as próximas 4 semanas).
          </p>

          <div className="cartoes">
            <div className="cartao">
              <p className="cartao-numero">{formatarMoeda(resumo.total.saldo)}</p>
              <p className="cartao-rotulo">Soma dos vencimentos</p>
            </div>
            <div className="cartao">
              <p className="cartao-numero">{formatarMoeda(resumo.total.previsto)}</p>
              <p className="cartao-rotulo">Previsão ajustada pelo risco</p>
            </div>
            <div className="cartao">
              <p className="cartao-numero">{formatarMoeda(resumo.total.diferenca)}</p>
              <p className="cartao-rotulo">
                Diferença: pode não entrar
                {resumo.total.saldo > 0
                  ? ` (${percentual(resumo.total.diferenca, resumo.total.saldo)}%)`
                  : ''}
              </p>
            </div>
          </div>

          {maximo === 0 && <p className="sucesso">Nada a receber nas próximas 4 semanas.</p>}

          {maximo > 0 && (
            <>
              <h2>Quanto deve entrar, período a período</h2>

              <p className="legenda">
                <span className="chave chave-previsto">Previsão ajustada</span>
                <span className="chave chave-diferenca">Diferença (pode não entrar)</span>
              </p>

              <ul className="grafico">
                {resumo.periodos.map((p) => (
                  <li key={p.chave}>
                    <p className="barra-rotulo">
                      <strong>{p.rotulo}</strong> <span>{intervalo(p)}</span>
                    </p>
                    {p.saldo > 0 ? (
                      <>
                        <div
                          className="barra-trilho"
                          aria-hidden="true"
                          title={`${p.rotulo}: previsão ${formatarMoeda(p.previsto)} de ${formatarMoeda(p.saldo)}`}
                        >
                          {p.previsto > 0 && (
                            <span
                              className="barra-previsto"
                              style={{ width: `${(p.previsto / maximo) * 100}%` }}
                            />
                          )}
                          {p.diferenca > 0 && (
                            <span
                              className="barra-diferenca"
                              style={{ width: `${(p.diferenca / maximo) * 100}%` }}
                            />
                          )}
                        </div>
                        <p className="barra-valores">
                          Deve entrar <strong>{formatarMoeda(p.previsto)}</strong> de{' '}
                          {formatarMoeda(p.saldo)}
                        </p>
                      </>
                    ) : (
                      <p className="barra-valores">Nada vence neste período.</p>
                    )}
                  </li>
                ))}
              </ul>

              <details>
                <summary>Ver os números em tabela</summary>
                <table className="tabela-titulos">
                  <thead>
                    <tr>
                      <th>Período</th>
                      <th>Soma dos vencimentos</th>
                      <th>Previsão ajustada</th>
                      <th>Diferença</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumo.periodos.map((p) => (
                      <tr key={p.chave}>
                        <td>
                          {p.rotulo} ({intervalo(p)})
                        </td>
                        <td>{formatarMoeda(p.saldo)}</td>
                        <td>{formatarMoeda(p.previsto)}</td>
                        <td>{formatarMoeda(p.diferenca)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td>
                        <strong>Total</strong>
                      </td>
                      <td>
                        <strong>{formatarMoeda(resumo.total.saldo)}</strong>
                      </td>
                      <td>
                        <strong>{formatarMoeda(resumo.total.previsto)}</strong>
                      </td>
                      <td>
                        <strong>{formatarMoeda(resumo.total.diferenca)}</strong>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </details>
            </>
          )}

          {resumo.depois.saldo > 0 && (
            <p>
              Depois dessas 4 semanas ainda há {formatarMoeda(resumo.depois.saldo)} a vencer
              (previsão de {formatarMoeda(resumo.depois.previsto)}). Esse valor não entra na conta
              acima.
            </p>
          )}

          {resumo.clientes.length > 0 && (
            <details>
              <summary>Ver por cliente ({resumo.clientes.length})</summary>
              <table className="tabela-titulos">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Em aberto</th>
                    <th>Chance de pagar</th>
                    <th>Deve entrar</th>
                  </tr>
                </thead>
                <tbody>
                  {resumo.clientes.map((c) => (
                    <tr key={c.cliente.id}>
                      <td>
                        <Link href={`/clientes/${c.cliente.id}`}>{c.cliente.nome}</Link>{' '}
                        <EtiquetaRisco risco={c.risco} />
                      </td>
                      <td>{formatarMoeda(c.saldo)}</td>
                      <td>{Math.round(c.probabilidade * 100)}%</td>
                      <td>{formatarMoeda(c.previsto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}

          <details>
            <summary>Como a previsão é calculada</summary>
            <p>
              Para cada cliente, o valor em aberto é multiplicado pela chance de ele pagar. A chance
              vem da nota de risco: 1 − nota ÷ 130, e nunca menos que 15%. Quanto maior o risco,
              menor a chance. A diferença é o que a nota de risco indica que pode não entrar. É uma
              estimativa, e os pesos vão ser ajustados com o uso real da loja.
            </p>
          </details>
        </>
      )}
    </main>
  );
}
