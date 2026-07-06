import { Skeleton, SkeletonLine } from "@/components/ui/skeleton";

export default function OverviewPageSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Loading overview">
      <section className="w-full">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6 xl:gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="min-h-[5.75rem] rounded-xl border border-cardBorder/60 bg-card/40 px-4 py-3"
            >
              <SkeletonLine className="w-16" />
              <Skeleton className="mt-3 h-6 w-20" />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-cardBorder bg-card/60 p-4 sm:p-5">
        <SkeletonLine className="w-28" />
        <SkeletonLine className="mt-2 w-48" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="rounded-xl px-2 py-2">
              <div className="mb-2 flex items-center justify-between gap-3">
                <SkeletonLine className="w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
