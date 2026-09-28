import { SkeletonBlock, SkeletonHeader } from '../componentes/ui/Skeleton';

export default function CarregandoClientes() {
  return (
    <div>
      <SkeletonHeader />
      <SkeletonBlock className="mb-6 h-14" />
      <div className="grid gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-20" />
        ))}
      </div>
    </div>
  );
}
