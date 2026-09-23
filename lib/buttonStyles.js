import { twMerge } from 'tailwind-merge';

const base =
  'inline-flex items-center justify-center gap-2 rounded-2xl font-bold whitespace-nowrap transition-[transform,box-shadow,background-color,color] duration-150 ease-out active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 disabled:pointer-events-none disabled:opacity-50';

const variantes = {
  primary: 'btn-primary-surface text-white',
  secondary: 'btn-secondary-surface text-ink hover:text-brand-700',
  ghost: 'text-ink-soft hover:bg-white/70 hover:text-ink',
};

const tamanhos = {
  sm: 'h-10 px-4 text-[15px]',
  md: 'h-12 px-5 text-base',
  lg: 'h-14 px-6 text-lg',
};

export function classesBotao(variante = 'primary', tamanho = 'md', extra) {
  return twMerge(base, variantes[variante], tamanhos[tamanho], extra);
}
