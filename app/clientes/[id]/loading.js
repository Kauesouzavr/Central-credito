import { SkeletonBlock } from '../../componentes/ui/Skeleton';

export default function CarregandoFicha() {
  return (
    <div>
      <SkeletonBlock className="mb-6 h-6 w-32" />
      <SkeletonBlock className="h-40" />
      <div className="mt-8 grid gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-24" />
        ))}
      </div>
    </div>
  );
}
