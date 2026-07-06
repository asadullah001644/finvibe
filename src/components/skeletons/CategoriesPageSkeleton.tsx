import { Skeleton, SkeletonLine } from "@/components/ui/skeleton";

export default function CategoriesPageSkeleton() {
  return (
    <div
      className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] lg:items-start"
      aria-busy="true"
      aria-label="Loading categories"
    >
      <section className="rounded-2xl border border-cardBorder bg-card/60 p-4 sm:p-5">
        <SkeletonLine className="w-32" />
        <Skeleton className="mt-3 h-9 w-36" />
        <SkeletonLine className="mt-2 w-48" />
        <div className="mt-5 space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <SkeletonLine className="w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-cardBorder bg-card/60 p-4 sm:p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="space-y-2">
            <SkeletonLine className="w-28" />
            <SkeletonLine className="w-52" />
          </div>
          <Skeleton className="h-11 w-20 rounded-xl" />
        </div>

        <div className="mb-4 flex gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-8 w-14 shrink-0 rounded-full" />
          ))}
        </div>

        <ul className="space-y-2 sm:space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <li
              key={index}
              className="rounded-2xl border border-cardBorder bg-background/70 px-3 py-3 sm:px-4"
            >
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
  );
}
