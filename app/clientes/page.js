import Link from 'next/link';
import { getSupabaseServerClient } from '../../lib/supabase-server';
import { carregarRiscos } from '../../lib/carregar-risco';
import EtiquetaRisco from '../componentes/EtiquetaRisco';

export const dynamic = 'force-dynamic';

export default async function Clientes() {
  const supabase = getSupabaseServerClient();

  const { data: clientes, error } = await supabase
    .from('clientes')
    .select('id, nome, telefone, segmento')
    .order('nome', { ascending: true });

  const { riscoDe, erro: erroRisco } = error
    ? { riscoDe: () => null, erro: null }
    : await carregarRiscos(supabase);

  return (
    <main className="pagina">
      <div className="cabecalho">
        <h1>Clientes</h1>
        <Link href="/clientes/novo" className="botao">
          + Novo cliente
        </Link>
      </div>

      {error && <p className="erro">Erro ao carregar clientes: {error.message}</p>}

      {erroRisco && <p className="erro">Não foi possível calcular o risco: {erroRisco}</p>}

      {!error && clientes.length === 0 && <p>Nenhum cliente cadastrado ainda.</p>}

      {!error && clientes.length > 0 && (
        <ul className="lista-clientes">
          {clientes.map((c) => {
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
