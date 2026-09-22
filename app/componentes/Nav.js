'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', rotulo: 'Hoje' },
  { href: '/clientes', rotulo: 'Clientes' },
  { href: '/clientes/novo', rotulo: 'Novo cliente' },
  { href: '/previsao', rotulo: 'Previsão' },
  { href: '/relatorio', rotulo: 'Relatório' },
];

// Ativo quando a rota atual é exatamente o link, ou é uma sub-rota dele
// (ex.: /clientes/abc123 deixa "Clientes" ativo) — exceto "/", que só fica
// ativo na própria home, senão ficaria sempre marcado.
function estaAtivo(pathname, href) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="nav">
      <div className="nav-conteudo">
        <Link href="/" className="nav-marca">
          Central de Crédito
        </Link>
        <nav className="nav-links">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={estaAtivo(pathname, link.href) ? 'nav-link nav-link-ativo' : 'nav-link'}
              aria-current={estaAtivo(pathname, link.href) ? 'page' : undefined}
            >
              {link.rotulo}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
