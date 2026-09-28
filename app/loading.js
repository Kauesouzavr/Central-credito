import { SkeletonBlock, SkeletonHeader } from './componentes/ui/Skeleton';

export default function CarregandoHoje() {
  return (
    <div>
      <SkeletonHeader />
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)_minmax(0,1fr)] lg:gap-14">
        <div className="grid grid-cols-2 gap-6 lg:block lg:space-y-6">
          <SkeletonBlock className="h-16" />
          <SkeletonBlock className="h-16" />
          <SkeletonBlock className="h-16" />
          <SkeletonBlock className="h-16" />
        </div>
        <SkeletonBlock className="mx-auto h-64 w-64 rounded-full" />
        <SkeletonBlock className="h-72" />
      </div>
      <SkeletonBlock className="mt-14 h-96" />
    </div>
  );
}
