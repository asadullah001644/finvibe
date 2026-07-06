import { Skeleton, SkeletonLine } from "@/components/ui/skeleton";

export default function CategoriesPageSkeleton() {
  return (
    <section
      className="rounded-2xl border border-cardBorder bg-card/60 p-4 sm:p-5"
      aria-busy="true"
      aria-label="Loading categories"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <SkeletonLine className="w-32" />
          <SkeletonLine className="w-52" />
        </div>
        <Skeleton className="h-11 w-28 rounded-xl" />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-cardBorder bg-background/60 px-3 py-3"
          >
            <SkeletonLine className="w-16" />
            <Skeleton className="mt-2 h-5 w-20" />
          </div>
        ))}
      </div>

      <ul className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <li
            key={index}
            className="rounded-2xl border border-cardBorder bg-background/70 px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonLine className="w-24" />
                <SkeletonLine className="w-40" />
                <SkeletonLine className="w-28" />
              </div>
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
