'use client';

import { useId } from 'react';
import { MinusIcon, PlusIcon } from 'lucide-react';

const botao =
  'btn-secondary-surface flex h-12 w-12 items-center justify-center rounded-2xl text-ink transition-[transform,color] duration-150 active:scale-95 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 disabled:opacity-40 disabled:pointer-events-none';

export function NumberStepper({ label, description, value, onChange, min, max, step = 1, unidade }) {
  const rotuloId = useId();
  const mudar = (delta) => onChange(Math.min(max, Math.max(min, value + delta)));

  return (
    <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
      <div className="min-w-0">
        <p id={rotuloId} className="text-lg font-bold text-ink">
          {label}
        </p>
        <p className="mt-1 max-w-md text-base text-ink-soft">{description}</p>
      </div>
      <div role="group" aria-labelledby={rotuloId} className="flex shrink-0 items-center gap-3">
        <button type="button" className={botao} onClick={() => mudar(-step)} disabled={value <= min} aria-label={`Diminuir ${label}`}>
          <MinusIcon className="h-5 w-5" />
        </button>
        <output aria-live="polite" className="flex w-20 flex-col items-center leading-none">
          <span className="text-3xl font-extrabold tabular-nums text-ink">{value}</span>
          {unidade && <span className="mt-1 text-sm font-medium text-ink-faint">{unidade}</span>}
        </output>
        <button type="button" className={botao} onClick={() => mudar(step)} disabled={value >= max} aria-label={`Aumentar ${label}`}>
          <PlusIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
