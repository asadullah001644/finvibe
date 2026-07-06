import { Skeleton, SkeletonLine } from "@/components/ui/skeleton";

export default function CalendarPageSkeleton() {
  return (
    <section className="w-full" aria-busy="true" aria-label="Loading calendar">
      <div className="rounded-2xl border border-cardBorder bg-card/50 p-4 sm:p-5">
        <SkeletonLine className="w-32" />
        <Skeleton className="mt-3 h-6 w-36" />

        <div className="mb-2 mt-5 grid grid-cols-7 gap-1 sm:gap-2">
          {Array.from({ length: 7 }).map((_, index) => (
            <SkeletonLine key={index} className="mx-auto w-8" />
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {Array.from({ length: 35 }).map((_, index) => (
            <Skeleton
              key={index}
              className="aspect-square rounded-lg sm:rounded-xl"
            />
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-md" />
              <SkeletonLine className="w-20" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
