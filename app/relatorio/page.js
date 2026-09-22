import Link from 'next/link';
import { getSupabaseServerClient } from '../../lib/supabase-server';
import { carregarRelatorio } from '../../lib/carregar-relatorio';
import { formatarData, formatarMoeda, plural } from '../../lib/util';

export const dynamic = 'force-dynamic';

const ROTULO_TIPO = {
  cadastro: 'Boas-vindas (cadastro)',
  antes_vencimento: 'Aviso antes do vencimento',
  vencimento: 'Aviso no dia do vencimento',
  atraso: 'Cobrança de atraso',
};

// "16/09 a 22/09" (sem o ano, que é sempre o atual).
function intervalo(periodo) {
  return `${formatarData(periodo.inicio).slice(0, 5)} a ${formatarData(periodo.fim).slice(0, 5)}`;
}

// null = sem base de comparação; 0 = igual; positivo/negativo = subiu/desceu.
function variacaoTexto(v) {
  if (v === null) return 'sem comparação (nada na semana anterior)';
  if (v === 0) return 'igual à semana passada';
  const seta = v > 0 ? '▲' : '▼';
  return `${seta} ${Math.abs(v)}% que a semana passada`;
}

export default async function Relatorio() {
  const supabase = getSupabaseServerClient();
  const { resumo, erro } = await carregarRelatorio(supabase);

  return (
    <main className="pagina">
      <Link href="/">← Voltar</Link>

      <h1>Relatório semanal</h1>

      {erro && <p className="erro">Não foi possível carregar o relatório: {erro}</p>}

      {resumo && (
        <>
          <p>
            Semana de {intervalo(resumo.semanaAtual)}, comparada com a anterior ({intervalo(resumo.semanaAnterior)}).
          </p>

          <div className="cartoes">
            <div className="cartao">
              <p className="cartao-numero">{formatarMoeda(resumo.atual.vendido)}</p>
              <p className="cartao-rotulo">
                Vendido na semana ({resumo.atual.titulosVendidos} {plural(resumo.atual.titulosVendidos, 'título', 'títulos')})
              </p>
              <p className="cartao-variacao">{variacaoTexto(resumo.variacao.vendido)}</p>
            </div>
            <div className="cartao">
              <p className="cartao-numero">{formatarMoeda(resumo.atual.recebido)}</p>
              <p className="cartao-rotulo">
                Recebido na semana ({resumo.atual.pagamentosCount} {plural(resumo.atual.pagamentosCount, 'pagamento', 'pagamentos')})
              </p>
              <p className="cartao-variacao">{variacaoTexto(resumo.variacao.recebido)}</p>
            </div>
            <div className="cartao">
              <p className="cartao-numero">{resumo.atual.clientesNovos}</p>
              <p className="cartao-rotulo">{plural(resumo.atual.clientesNovos, 'cliente novo', 'clientes novos')}</p>
              <p className="cartao-variacao">{variacaoTexto(resumo.variacao.clientesNovos)}</p>
            </div>
            <div className="cartao">
              <p className="cartao-numero">{resumo.atual.novosAtrasos}</p>
              <p className="cartao-rotulo">
                {plural(resumo.atual.novosAtrasos, 'título atrasou', 'títulos atrasaram')} na semana
              </p>
              <p className="cartao-variacao">{variacaoTexto(resumo.variacao.novosAtrasos)}</p>
            </div>
            <div className="cartao">
              <p className="cartao-numero">{resumo.atual.mensagensEnviadas}</p>
              <p className="cartao-rotulo">
                {plural(resumo.atual.mensagensEnviadas, 'mensagem de WhatsApp mandada', 'mensagens de WhatsApp mandadas')}
              </p>
              <p className="cartao-variacao">{variacaoTexto(resumo.variacao.mensagensEnviadas)}</p>
            </div>
          </div>

          <details>
            <summary>Ver mensagens por tipo</summary>
            <table className="tabela-titulos">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Essa semana</th>
                  <th>Semana anterior</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(ROTULO_TIPO).map(([tipo, rotulo]) => (
                  <tr key={tipo}>
                    <td>{rotulo}</td>
                    <td>{resumo.atual.mensagensPorTipo[tipo]}</td>
                    <td>{resumo.anterior.mensagensPorTipo[tipo]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>

          <details>
            <summary>Como esses números são calculados</summary>
            <p>
              <strong>Vendido</strong> soma o valor dos títulos criados na semana. <strong>Recebido</strong> soma os
              pagamentos feitos na semana (pode ser de um título de outra semana). <strong>Títulos atrasaram</strong>{' '}
              conta quem venceu dentro da semana e continua em aberto hoje — se venceu e foi pago ainda dentro da
              mesma semana, não entra aqui. As mensagens de WhatsApp contam só o que realmente foi enviado.
            </p>
          </details>
        </>
      )}
    </main>
  );
}
