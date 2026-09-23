'use client';

import { useId } from 'react';
import { twMerge } from 'tailwind-merge';

export function TextField({ label, hint, error, leading, optional, className, id, ...rest }) {
  const gerado = useId();
  const campoId = id ?? gerado;
  const ajudaId = `${campoId}-ajuda`;

  return (
    <div className={className}>
      <label htmlFor={campoId} className="mb-2 block text-base font-semibold text-ink">
        {label}
        {optional && <span className="ml-2 font-medium text-ink-faint">(opcional)</span>}
      </label>
      <div
        className={twMerge(
          'flex h-14 items-center rounded-2xl bg-white px-4 ring-1 ring-line transition-shadow duration-150 focus-within:ring-2 focus-within:ring-brand-400',
          error && 'ring-2 ring-brand-500'
        )}
      >
        {leading && <span className="mr-2 text-lg font-semibold text-ink-faint">{leading}</span>}
        <input
          id={campoId}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? ajudaId : undefined}
          className="h-full w-full min-w-0 bg-transparent text-lg text-ink outline-none placeholder:text-ink-faint"
          {...rest}
        />
      </div>
      {error ? (
        <p id={ajudaId} className="mt-1.5 text-sm font-semibold text-brand-700">
          {error}
        </p>
      ) : (
        hint && (
          <p id={ajudaId} className="mt-1.5 text-sm text-ink-faint">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
