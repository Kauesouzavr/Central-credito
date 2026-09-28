import { twMerge } from 'tailwind-merge';

// Bloco cinza pulsando, pra mostrar enquanto a página carrega os dados (em
// vez de tela branca) — usado pelos `loading.js` de cada rota.
export function SkeletonBlock({ className }) {
  return <div className={twMerge('animate-pulse rounded-2xl bg-white/60', className)} aria-hidden="true" />;
}

export function SkeletonHeader() {
  return (
    <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="grid gap-3">
        <SkeletonBlock className="h-4 w-28" />
        <SkeletonBlock className="h-9 w-56" />
      </div>
      <SkeletonBlock className="h-12 w-40 rounded-2xl" />
    </div>
  );
}
