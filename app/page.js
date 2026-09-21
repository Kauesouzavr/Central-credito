import Link from 'next/link';

export default function Home() {
  return (
    <main className="pagina">
      <h1>Central de Crédito</h1>
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
