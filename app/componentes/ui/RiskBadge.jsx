import { twMerge } from 'tailwind-merge';
import { ESTILO_SELO, ROTULO_NIVEL } from '../../../lib/risco-ui';

export function RiskBadge({ nivel, nota, className }) {
  return (
    <span
      className={twMerge(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-sm font-bold',
        ESTILO_SELO[nivel],
        className
      )}
    >
      {ROTULO_NIVEL[nivel]}
      <span className="tabular-nums opacity-80">· {Math.floor(nota)}</span>
    </span>
  );
}
