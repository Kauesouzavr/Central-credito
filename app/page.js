import Link from 'next/link';

export default function Home() {
  return (
    <main className="pagina">
      <h1>Central de Crédito</h1>

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

      <div className="menu-inicial">
        <Link href="/clientes/novo" className="botao">
          + Cadastrar cliente
        </Link>
        <Link href="/clientes" className="botao botao-secundario">
          Ver clientes
        </Link>
      </div>
    </main>
  );
}
