import { ProductCardSkeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground" aria-busy="true" aria-label="Loading page">
      {/* Top Banner / Hero Skeleton */}
      <div className="mx-auto max-w-7xl px-5 pt-8 sm:px-8 lg:px-10">
        <div className="space-y-3">
          <div className="h-4 w-28 rounded-md bg-slate-200/80 animate-pulse" />
          <div className="h-10 w-3/5 rounded-2xl bg-slate-200/80 animate-pulse sm:w-2/5" />
          <div className="h-4 w-4/5 rounded-md bg-slate-100 animate-pulse sm:w-1/2" />
        </div>

        {/* Filter Pills Skeleton */}
        <div className="mt-8 flex gap-3 overflow-hidden pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-10 w-24 shrink-0 rounded-full bg-slate-200/70 animate-pulse"
            />
          ))}
        </div>

        {/* Product Cards Grid Skeleton */}
        <div className="mt-10 grid grid-cols-2 gap-4 pb-24 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <ProductCardSkeleton key={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
