import { Fragment } from 'react';
import Link from 'next/link';
import { getSupabaseServerClient } from '../../../lib/supabase-server';
import { FORMAS_PAGAMENTO, formatarData, formatarMoeda, paraCentavos } from '../../../lib/util';
import { carregarRiscos } from '../../../lib/carregar-risco';
import BotaoAcao from '../../componentes/BotaoAcao';
import EtiquetaRisco from '../../componentes/EtiquetaRisco';
import { marcarTituloComoPago, marcarTudoComoPago, registrarPagamentoParcial } from './actions';

export const dynamic = 'force-dynamic';

const STATUS_LABEL = {
  pago: 'Pago',
  atrasado: 'Atrasado',
  em_aberto: 'Em aberto',
};

export default async function FichaCliente({ params, searchParams }) {
  const { id } = await params;
  const { ok, erro } = (await searchParams) || {};
  const supabase = getSupabaseServerClient();

  const { data: cliente, error: erroCliente } = await supabase
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single();

  if (erroCliente || !cliente) {
    return (
      <main className="pagina">
        <p className="erro">Cliente não encontrado.</p>
        <Link href="/clientes">← Voltar pra lista</Link>
      </main>
    );
  }

  const { data: titulos, error: erroTitulos } = await supabase
    .from('titulos_com_saldo')
    .select('*')
    .eq('cliente_id', id)
    .order('data_vencimento', { ascending: true });

  const { riscoDe, erro: erroRisco } = await carregarRiscos(supabase, { clienteId: id });
  const risco = riscoDe(id);

  const abertos = (titulos || []).filter((t) => t.status !== 'pago');
  const totalAberto =
    abertos.reduce((soma, t) => soma + paraCentavos(t.valor_restante), 0) / 100;

  return (
    <main className="pagina">
      <Link href="/clientes">← Voltar pra lista</Link>

      <h1>{cliente.nome}</h1>
      <p>
        Telefone: {cliente.telefone}
        {cliente.telefone_reserva ? ` (reserva: ${cliente.telefone_reserva})` : ''}
      </p>
      {cliente.segmento && <p>Segmento/cidade: {cliente.segmento}</p>}

      {ok && <p className="sucesso">{ok}</p>}
      {erro && <p className="erro">{erro}</p>}

      {erroRisco && <p className="erro">Não foi possível calcular o risco: {erroRisco}</p>}

      {risco && (
        <section className="caixa-risco">
          <p>
            <EtiquetaRisco risco={risco} /> Nota {Math.floor(risco.nota)} de 100
          </p>
          <ul>
            {risco.motivos.map((motivo) => (
              <li key={motivo}>{motivo}</li>
            ))}
          </ul>
          <details>
            <summary>Como a nota foi calculada</summary>
            <p>
              Atraso atual: {risco.partes.atraso} de {risco.maximos.atraso} · Perfil do cliente:{' '}
              {risco.partes.perfil} de {risco.maximos.perfil} · Mudança de padrão:{' '}
              {risco.partes.mudanca} de {risco.maximos.mudanca}
            </p>
          </details>
        </section>
      )}

      <div className="cabecalho">
        <h2>Títulos</h2>
        <Link href={`/clientes/${cliente.id}/nova-compra`} className="botao">
          + Nova compra
        </Link>
      </div>

      {erroTitulos && <p className="erro">Erro ao carregar títulos: {erroTitulos.message}</p>}

      {!erroTitulos && titulos.length === 0 && <p>Nenhum título ainda.</p>}

      {!erroTitulos && abertos.length > 0 && (
        <form action={marcarTudoComoPago} className="marcar-tudo">
          <input type="hidden" name="cliente_id" value={cliente.id} />
          <p>
            Total em aberto: <strong>{formatarMoeda(totalAberto)}</strong>
          </p>
          <BotaoAcao
            className="botao-secundario"
            confirmar={`Marcar TODOS os títulos em aberto de ${cliente.nome} como pagos (${formatarMoeda(totalAberto)})?`}
          >
            Marcar tudo como pago
          </BotaoAcao>
        </form>
      )}

      {!erroTitulos && titulos.length > 0 && (
        <table className="tabela-titulos">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Valor</th>
              <th>Pago</th>
              <th>Restante</th>
              <th>Vencimento</th>
              <th>Forma</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {titulos.map((t) => (
              <Fragment key={t.id}>
                <tr>
                  <td>{t.produto}</td>
                  <td>{formatarMoeda(t.valor)}</td>
                  <td>{formatarMoeda(t.valor_pago)}</td>
                  <td>{formatarMoeda(t.valor_restante)}</td>
                  <td>{formatarData(t.data_vencimento)}</td>
                  <td>{t.forma_pagamento}</td>
                  <td>{STATUS_LABEL[t.status] || t.status}</td>
                </tr>

                {t.status !== 'pago' && (
                  <tr className="linha-acoes">
                    <td colSpan={7}>
                      <div className="acoes-titulo">
                        <form action={marcarTituloComoPago}>
                          <input type="hidden" name="cliente_id" value={cliente.id} />
                          <input type="hidden" name="titulo_id" value={t.id} />
                          <BotaoAcao
                            confirmar={`Marcar "${t.produto}" como pago (${formatarMoeda(t.valor_restante)})?`}
                          >
                            Marcar como pago
                          </BotaoAcao>
                        </form>

                        <details>
                          <summary>Pagamento parcial</summary>
                          <form action={registrarPagamentoParcial} className="formulario">
                            <input type="hidden" name="cliente_id" value={cliente.id} />
                            <input type="hidden" name="titulo_id" value={t.id} />

                            <label>
                              Quanto o cliente pagou? (R$)
                              <input
                                type="number"
                                name="valor"
                                required
                                min="0.01"
                                max={t.valor_restante}
                                step="0.01"
                              />
                            </label>

                            <label>
                              Forma de pagamento
                              <select name="forma_pagamento" defaultValue={t.forma_pagamento}>
                                {FORMAS_PAGAMENTO.map((forma) => (
                                  <option key={forma} value={forma}>
                                    {forma}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <BotaoAcao>Registrar pagamento</BotaoAcao>
                          </form>
                        </details>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
