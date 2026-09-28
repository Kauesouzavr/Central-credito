import { SkeletonBlock, SkeletonHeader } from '../componentes/ui/Skeleton';

export default function CarregandoRelatorio() {
  return (
    <div>
      <SkeletonHeader />
      <div className="grid gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-16" />
        ))}
      </div>
    </div>
  );
}
