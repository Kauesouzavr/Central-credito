import { SkeletonBlock, SkeletonHeader } from '../componentes/ui/Skeleton';

export default function CarregandoAjustes() {
  return (
    <div>
      <SkeletonHeader />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid gap-8">
          <SkeletonBlock className="h-72" />
          <SkeletonBlock className="h-64" />
        </div>
        <SkeletonBlock className="h-96" />
      </div>
    </div>
  );
}
