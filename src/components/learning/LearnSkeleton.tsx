import { Skeleton } from '@/components/ui';

export function LearnSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]" aria-busy="true" aria-label="Loading lesson">
      <div className="space-y-4"><Skeleton className="aspect-video w-full rounded-2xl" /><Skeleton className="h-8 w-2/3" /><Skeleton className="h-32 rounded-2xl" /></div>
      <Skeleton className="hidden h-96 rounded-2xl lg:block" />
    </div>
  );
}
