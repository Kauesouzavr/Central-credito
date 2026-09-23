'use client';

import { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import { FORMAS_PAGAMENTO } from '../../../lib/util';

// Funciona controlado (passe `value`+`onChange`, quando quem chama precisa
// reagir à escolha, ex.: prévia ao vivo) ou sozinho dentro de um
// `<form action={...}>` normal (passe só `name`+`defaultValue` — o próprio
// componente guarda o estado e emite um input escondido com esse `name`).
export function FormaPagamentoPicker({
  name,
  value,
  defaultValue = 'Dinheiro',
  onChange,
  label = 'Forma de pagamento',
  opcoes = FORMAS_PAGAMENTO,
}) {
  const controlado = value !== undefined;
  const [interno, setInterno] = useState(defaultValue);
  const atual = controlado ? value : interno;

  function escolher(forma) {
    if (controlado) onChange(forma);
    else setInterno(forma);
  }

  return (
    <fieldset>
      <legend className="mb-2 text-base font-semibold text-ink">{label}</legend>
      {name && <input type="hidden" name={name} value={atual} />}
      <div role="radiogroup" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {opcoes.map((forma) => {
          const ativo = forma === atual;
          return (
            <button
              key={forma}
              type="button"
              role="radio"
              aria-checked={ativo}
              onClick={() => escolher(forma)}
              className={twMerge(
                'h-12 rounded-2xl text-base font-semibold transition-[background-color,color,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200',
                ativo ? 'btn-primary-surface text-white' : 'btn-secondary-surface text-ink hover:text-brand-700'
              )}
            >
              {forma}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
