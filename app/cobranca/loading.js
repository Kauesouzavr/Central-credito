import { SkeletonBlock, SkeletonHeader } from '../componentes/ui/Skeleton';

export default function CarregandoCobranca() {
  return (
    <div>
      <SkeletonHeader />
      <SkeletonBlock className="h-24" />
      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <SkeletonBlock className="h-96" />
        <SkeletonBlock className="h-96" />
      </div>
    </div>
  );
}
