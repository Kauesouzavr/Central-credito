'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { GaugeIcon } from 'lucide-react';

const ITENS = [
  { href: '/', rotulo: 'Hoje' },
  { href: '/clientes', rotulo: 'Clientes' },
  { href: '/previsao', rotulo: 'Previsão' },
  { href: '/cobranca', rotulo: 'Cobrança' },
  { href: '/relatorio', rotulo: 'Relatório' },
  { href: '/ajustes', rotulo: 'Ajustes' },
];

// Ativo quando a rota atual é exatamente o link, ou é uma sub-rota dele
// (ex.: /clientes/abc123 deixa "Clientes" ativo) — exceto "/", que só fica
// ativo na própria home, senão ficaria sempre marcado.
function estaAtivo(pathname, href) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 px-3 pt-3 sm:px-6 lg:px-8">
      <div className="glass mx-auto flex max-w-[1440px] flex-col gap-2 rounded-3xl px-3 py-2.5 md:flex-row md:items-center md:gap-6">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-2xl px-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
        >
          <span className="brand-mark flex h-11 w-11 items-center justify-center rounded-2xl text-white">
            <GaugeIcon className="h-6 w-6" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block text-lg font-extrabold tracking-tight text-ink">Central de Crédito</span>
            <span className="block text-sm font-medium text-ink-faint">Sapataria</span>
          </span>
        </Link>
        <nav aria-label="Principal" className="-mx-1 flex overflow-x-auto md:ml-auto">
          {ITENS.map((item) => {
            const ativo = estaAtivo(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={ativo ? 'page' : undefined}
                className={`relative flex h-12 shrink-0 items-center rounded-2xl px-4 text-base font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 ${
                  ativo ? 'text-brand-700' : 'text-ink-soft hover:text-ink'
                }`}
              >
                {ativo && (
                  <motion.span
                    layoutId="nav-ativo"
                    className="absolute inset-0 rounded-2xl bg-white shadow-[0_6px_18px_-8px_rgba(125,23,15,0.35)] ring-1 ring-brand-100"
                    transition={{ type: 'tween', duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                  />
                )}
                <span className="relative">{item.rotulo}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
