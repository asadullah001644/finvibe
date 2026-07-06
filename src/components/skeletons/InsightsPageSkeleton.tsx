import { Skeleton, SkeletonLine } from "@/components/ui/skeleton";

export default function InsightsPageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading insights">
      <section className="w-full">
        <div className="mb-4 rounded-2xl border border-cardBorder bg-card px-4 py-4">
          <SkeletonLine className="w-24" />
          <Skeleton className="mt-3 h-8 w-32" />
          <SkeletonLine className="mt-2 w-40" />
        </div>

        <div className="rounded-2xl border border-cardBorder bg-card/60 p-3 sm:p-5">
          <div className="mb-4 space-y-2">
            <SkeletonLine className="w-32" />
            <SkeletonLine className="w-48" />
          </div>
          <Skeleton className="h-56 w-full rounded-xl sm:h-64" />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-xl border border-cardBorder/60 px-3 py-3">
                <SkeletonLine className="w-16" />
                <Skeleton className="mt-2 h-5 w-14" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-neonViolet/20 bg-card/60 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <SkeletonLine className="w-28" />
            <Skeleton className="h-6 w-48" />
            <SkeletonLine className="w-full max-w-xl" />
          </div>
          <Skeleton className="h-12 w-full rounded-2xl sm:w-56" />
        </div>
        <div className="mt-6 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[92%]" />
          <Skeleton className="h-4 w-[84%]" />
        </div>
      </section>
    </div>
  );
}
