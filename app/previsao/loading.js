import { SkeletonBlock, SkeletonHeader } from '../componentes/ui/Skeleton';

export default function CarregandoPrevisao() {
  return (
    <div>
      <SkeletonHeader />
      <div className="grid gap-6 sm:grid-cols-3">
        <SkeletonBlock className="h-28" />
        <SkeletonBlock className="h-28" />
        <SkeletonBlock className="h-28" />
      </div>
      <SkeletonBlock className="mt-8 h-80" />
    </div>
  );
}
