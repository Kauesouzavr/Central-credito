'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { PlusIcon, SearchIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { classesBotao } from '../../../lib/buttonStyles';
import { combinaComBusca } from '../../../lib/util';
import { GlassPanel } from '../ui/GlassPanel';
import { PageHeader } from '../ui/PageHeader';
import { ClienteRow, colunasClientes } from './ClienteRow';

const FILTROS = [
  { valor: 'todos', rotulo: 'Todos' },
  { valor: 'alto', rotulo: 'Risco alto' },
  { valor: 'medio', rotulo: 'Risco médio' },
  { valor: 'baixo', rotulo: 'Risco baixo' },
];

export function ListaClientes({ clientes }) {
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('todos');

  const contagem = useMemo(() => {
    const c = { todos: clientes.length, alto: 0, medio: 0, baixo: 0 };
    clientes.forEach((cl) => {
      c[cl.risco.nivel] += 1;
    });
    return c;
  }, [clientes]);

  const visiveis = useMemo(() => {
    return clientes.filter(
      (c) =>
        (filtro === 'todos' || c.risco.nivel === filtro) &&
        (combinaComBusca(c.nome, busca) || (c.segmento && combinaComBusca(c.segmento, busca)) || c.telefone.includes(busca))
    );
  }, [clientes, busca, filtro]);

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Quem está mais perto de virar calote aparece primeiro."
        actions={
          <Link href="/clientes?novo=1" className={classesBotao('primary', 'lg')}>
            <PlusIcon className="h-5 w-5" aria-hidden="true" />
            Novo cliente
          </Link>
        }
      />

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center">
        <label className="glass flex h-14 flex-1 items-center gap-3 rounded-2xl px-4 focus-within:ring-2 focus-within:ring-brand-400">
          <SearchIcon className="h-5 w-5 text-ink-faint" aria-hidden="true" />
          <span className="sr-only">Buscar cliente</span>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, bairro ou telefone"
            className="h-full w-full bg-transparent text-lg text-ink outline-none placeholder:text-ink-faint"
          />
        </label>
        <div role="radiogroup" aria-label="Filtrar por risco" className="glass flex gap-1 overflow-x-auto rounded-2xl p-1.5">
          {FILTROS.map((f) => {
            const ativo = filtro === f.valor;
            return (
              <button
                key={f.valor}
                type="button"
                role="radio"
                aria-checked={ativo}
                onClick={() => setFiltro(f.valor)}
                className={twMerge(
                  'flex h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-base font-bold transition-[background-color,color] duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200',
                  ativo ? 'bg-white text-brand-700 shadow-[0_4px_14px_-6px_rgba(125,23,15,0.3)]' : 'text-ink-soft hover:text-ink'
                )}
              >
                {f.rotulo}
                <span className="tabular-nums text-ink-faint">{contagem[f.valor]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <GlassPanel className="p-2 sm:p-3">
        <div className={`hidden gap-6 px-4 pb-2 pt-3 text-sm font-bold text-ink-faint lg:grid ${colunasClientes}`} aria-hidden="true">
          <span>Cliente</span>
          <span>Compras abertas</span>
          <span>Maior atraso</span>
          <span>Saldo aberto</span>
          <span>Risco</span>
          <span />
        </div>
        {visiveis.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-lg font-bold text-ink">Nenhum cliente encontrado</p>
            <p className="mt-1 text-ink-soft">Tente outro nome ou limpe o filtro.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line/80">
            {visiveis.map((c) => (
              <ClienteRow key={c.id} cliente={c} />
            ))}
          </ul>
        )}
      </GlassPanel>
    </div>
  );
}
