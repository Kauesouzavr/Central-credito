import Link from 'next/link';
import { getSupabaseServerClient } from '../../lib/supabase-server';

export const dynamic = 'force-dynamic';

export default async function Clientes() {
  const supabase = getSupabaseServerClient();

  const { data: clientes, error } = await supabase
    .from('clientes')
    .select('id, nome, telefone, segmento')
    .order('nome', { ascending: true });

  return (
    <main className="pagina">
      <div className="cabecalho">
        <h1>Clientes</h1>
        <Link href="/clientes/novo" className="botao">
          + Novo cliente
        </Link>
      </div>

      {error && <p className="erro">Erro ao carregar clientes: {error.message}</p>}

      {!error && clientes.length === 0 && <p>Nenhum cliente cadastrado ainda.</p>}

      {!error && clientes.length > 0 && (
        <ul className="lista-clientes">
          {clientes.map((c) => (
            <li key={c.id}>
              <Link href={`/clientes/${c.id}`}>
                <strong>{c.nome}</strong> — {c.telefone}
                {c.segmento ? ` · ${c.segmento}` : ''}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
