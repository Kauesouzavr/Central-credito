import Link from 'next/link';
import { getSupabaseServerClient } from '../../lib/supabase-server';
import { carregarRiscos } from '../../lib/carregar-risco';
import { combinaComBusca } from '../../lib/util';
import EtiquetaRisco from '../componentes/EtiquetaRisco';

export const dynamic = 'force-dynamic';

export default async function Clientes({ searchParams }) {
  const parametros = (await searchParams) || {};
  const buscaBruta = Array.isArray(parametros.busca) ? parametros.busca[0] : parametros.busca;
  const busca = (buscaBruta || '').trim();

  const supabase = getSupabaseServerClient();

  const { data: clientes, error } = await supabase
    .from('clientes')
    .select('id, nome, telefone, segmento')
    .order('nome', { ascending: true });

  const { riscoDe, erro: erroRisco } = error
    ? { riscoDe: () => null, erro: null }
    : await carregarRiscos(supabase);

  // A busca é feita aqui (e não no banco) pra ignorar acento e maiúscula:
  // quem digita "jose" precisa achar "José".
  const encontrados = error ? [] : clientes.filter((c) => combinaComBusca(c.nome, busca));

  return (
    <main className="pagina">
      <div className="cabecalho">
        <h1>Clientes</h1>
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
            defaultValue={busca}
            placeholder="ex: Maria"
            autoComplete="off"
            autoFocus
          />
        </label>
        <button type="submit">Buscar</button>
        {busca && (
          <Link href="/clientes" className="botao botao-secundario">
            Ver todos
          </Link>
        )}
      </form>

      {error && <p className="erro">Erro ao carregar clientes: {error.message}</p>}

      {erroRisco && <p className="erro">Não foi possível calcular o risco: {erroRisco}</p>}

      {!error && clientes.length === 0 && <p>Nenhum cliente cadastrado ainda.</p>}

      {!error && clientes.length > 0 && busca && encontrados.length === 0 && (
        <div>
          <p>
            Nenhum cliente encontrado com &quot;<strong>{busca}</strong>&quot;. Confira se o nome
            está certo, ou cadastre como cliente novo.
          </p>
          <Link href="/clientes/novo" className="botao">
            + Cadastrar cliente novo
          </Link>
        </div>
      )}

      {busca && encontrados.length > 0 && (
        <p>
          {encontrados.length} {encontrados.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}.
        </p>
      )}

      {encontrados.length > 0 && (
        <ul className="lista-clientes">
          {encontrados.map((c) => {
            const risco = riscoDe(c.id);
            return (
              <li key={c.id}>
                <Link href={`/clientes/${c.id}`}>
                  <strong>{c.nome}</strong> — {c.telefone}
                  {c.segmento ? ` · ${c.segmento}` : ''}
                  {risco && (
                    <span className="linha-risco">
                      <EtiquetaRisco risco={risco} />
                      {risco.motivos.slice(0, 2).join(' · ')}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
