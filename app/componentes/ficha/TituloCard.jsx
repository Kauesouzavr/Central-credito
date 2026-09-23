'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckIcon, ChevronDownIcon, CoinsIcon } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { formatarData, formatarMoeda, plural } from '../../../lib/util';
import { descreverVencimento, estiloStatusTitulo } from '../../../lib/titulo-ui';
import { Button } from '../ui/Button';
import { GlassPanel } from '../ui/GlassPanel';

// `titulo` = linha de titulos_com_saldo + `pagamentos: []` anexado por quem
// carrega a página. `hoje` = 'YYYY-MM-DD' (fuso de Brasília).
export function TituloCard({ titulo, hoje, onParcial, onQuitar }) {
  const [verPagamentos, setVerPagamentos] = useState(false);
  const aberto = Number(titulo.valor_restante) > 0;
  const pct = Math.min(100, (Number(titulo.valor_pago) / Number(titulo.valor)) * 100);

  return (
    <GlassPanel as="article" className={twMerge('p-5 sm:p-6', !aberto && 'opacity-80')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-xl font-extrabold tracking-tight text-ink">{titulo.produto}</h3>
          <p className="mt-0.5 text-base text-ink-soft">
            Comprado em {formatarData(titulo.data_venda)} · {titulo.forma_pagamento}
          </p>
        </div>
        <span className={twMerge('whitespace-nowrap rounded-full px-3 py-1 text-sm font-bold ring-1', estiloStatusTitulo(titulo, hoje))}>
          {descreverVencimento(titulo, hoje)}
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-4">
        <div>
          <dt className="text-sm text-ink-faint">Total</dt>
          <dd className="text-lg font-bold tabular-nums text-ink">{formatarMoeda(titulo.valor)}</dd>
        </div>
        <div>
          <dt className="text-sm text-ink-faint">Pago</dt>
          <dd className="text-lg font-bold tabular-nums text-ink">{formatarMoeda(titulo.valor_pago)}</dd>
        </div>
        <div>
          <dt className="text-sm text-ink-faint">Falta</dt>
          <dd className={twMerge('text-2xl font-extrabold tabular-nums', titulo.status === 'atrasado' ? 'text-brand-700' : 'text-ink')}>
            {formatarMoeda(titulo.valor_restante)}
          </dd>
        </div>
      </dl>

      <div
        className="mt-4 h-2.5 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Quanto já foi pago"
      >
        <div
          className={twMerge('h-full rounded-full', aberto ? 'bar-fill' : 'bg-ok-500')}
          style={{ width: `${Math.max(pct, aberto ? 2 : 100)}%` }}
        />
      </div>
      <p className="mt-2 text-base text-ink-soft">Vencimento: {formatarData(titulo.data_vencimento)}</p>

      {titulo.pagamentos.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setVerPagamentos((v) => !v)}
            aria-expanded={verPagamentos}
            className="inline-flex items-center gap-1.5 rounded-lg text-base font-bold text-ink-soft hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200"
          >
            {verPagamentos ? 'Esconder pagamentos' : `Ver pagamentos (${titulo.pagamentos.length})`}
            <ChevronDownIcon className={twMerge('h-4 w-4 transition-transform duration-200', verPagamentos && 'rotate-180')} aria-hidden="true" />
          </button>
          <AnimatePresence initial={false}>
            {verPagamentos && (
              <motion.ul
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-hidden"
              >
                {titulo.pagamentos.map((p) => (
                  <li key={p.id} className="flex items-center justify-between border-b border-line py-2.5 text-base last:border-0">
                    <span className="text-ink-soft">
                      {formatarData(p.data_pagamento)} · {p.forma_pagamento}
                    </span>
                    <span className="font-bold tabular-nums text-ok-700">+ {formatarMoeda(p.valor)}</span>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      )}

      {aberto && (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Button variant="secondary" size="lg" icon={<CoinsIcon className="h-5 w-5" aria-hidden="true" />} onClick={onParcial}>
            Pagamento parcial
          </Button>
          <Button variant="secondary" size="lg" icon={<CheckIcon className="h-5 w-5 text-ok-500" aria-hidden="true" />} onClick={onQuitar}>
            Marcar como pago
          </Button>
        </div>
      )}
    </GlassPanel>
  );
}
