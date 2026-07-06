import { Skeleton, SkeletonLine } from "@/components/ui/skeleton";

export default function OverviewPageSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Loading overview">
      <section className="w-full">
        <div className="space-y-3 sm:hidden">
          <div className="rounded-2xl border border-cardBorder/60 bg-card/40 px-4 py-4">
            <SkeletonLine className="w-20" />
            <Skeleton className="mt-3 h-9 w-36" />
            <Skeleton className="mt-4 h-2 w-full rounded-full" />
            <SkeletonLine className="mt-2 w-40" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="rounded-xl border border-cardBorder/60 bg-card/40 px-2.5 py-2.5"
              >
                <SkeletonLine className="mx-auto w-10" />
                <Skeleton className="mx-auto mt-2 h-4 w-12" />
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-xl border border-cardBorder/60 bg-card/30 px-3 py-2.5"
              >
                <SkeletonLine className="w-24" />
                <Skeleton className="h-3.5 w-16" />
              </div>
            ))}
          </div>
        </div>

        <div className="hidden grid-cols-3 gap-3 sm:grid xl:grid-cols-6 xl:gap-4">
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
              <div className="flex items-center justify-between gap-3">
                <SkeletonLine className="w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
