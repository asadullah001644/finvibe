import { Skeleton, SkeletonLine } from "@/components/ui/skeleton";

export default function CategoriesPageSkeleton() {
  return (
    <div className="space-y-4 lg:space-y-6" aria-busy="true" aria-label="Loading categories">
      <header className="rounded-2xl border border-cardBorder bg-card/60 px-4 py-4 sm:px-5">
        <SkeletonLine className="w-20" />
        <Skeleton className="mt-2 h-9 w-36" />
        <SkeletonLine className="mt-2 w-40" />
      </header>

      <div className="flex gap-2 lg:hidden">
        <Skeleton className="h-11 flex-1 rounded-xl" />
        <Skeleton className="h-11 flex-1 rounded-xl" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-start lg:gap-8">
        <section className="rounded-2xl border border-cardBorder bg-card/60 p-4 sm:p-5">
          <SkeletonLine className="w-24" />
          <SkeletonLine className="mt-2 w-48" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-xl px-3 py-2.5"
              >
                <SkeletonLine className="w-28" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-cardBorder bg-card/60 p-4 sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="space-y-2">
              <SkeletonLine className="w-20" />
              <SkeletonLine className="w-36" />
            </div>
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-7 w-16 rounded-full" />
            ))}
          </div>

          <ul className="divide-y divide-cardBorder/70 overflow-hidden rounded-xl border border-cardBorder/80">
            {Array.from({ length: 5 }).map((_, index) => (
              <li key={index} className="bg-background/30 px-3 py-3 sm:px-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <SkeletonLine className="w-24" />
                    <SkeletonLine className="w-40" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
