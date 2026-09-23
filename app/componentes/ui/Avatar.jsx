import { twMerge } from 'tailwind-merge';
import { iniciais } from '../../../lib/util';
import { TOM_AVATAR } from '../../../lib/risco-ui';

export function Avatar({ nome, nivel = 'baixo', size = 'md' }) {
  return (
    <span
      aria-hidden="true"
      className={twMerge(
        'flex shrink-0 items-center justify-center rounded-full font-extrabold',
        size === 'lg' ? 'h-16 w-16 text-xl' : 'h-12 w-12 text-base',
        TOM_AVATAR[nivel]
      )}
    >
      {iniciais(nome)}
    </span>
  );
}
