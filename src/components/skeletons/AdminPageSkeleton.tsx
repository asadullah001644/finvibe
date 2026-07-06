import { Skeleton, SkeletonLine } from "@/components/ui/skeleton";

export default function AdminPageSkeleton() {
  return (
    <main
      className="min-h-screen bg-[#09090B] px-3 py-6 pb-10 text-zinc-100 sm:px-4 sm:py-8"
      aria-busy="true"
      aria-label="Loading admin"
    >
      <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <SkeletonLine className="w-24" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-11 w-full rounded-xl sm:w-32" />
        </div>

        <section className="rounded-2xl border border-[#27272A] bg-[#18181B] p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="mt-4 h-10 w-full rounded-xl sm:w-32" />
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#27272A] bg-[#18181B]">
          <div className="border-b border-[#27272A] px-4 py-3">
            <SkeletonLine className="w-24" />
          </div>
          <div className="space-y-3 p-4 md:hidden">
            {Array.from({ length: 4 }).map((_, index) => (
              <article
                key={index}
                className="rounded-xl border border-[#27272A] bg-[#09090B] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <SkeletonLine className="w-40" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
                <div className="mt-4 flex gap-2">
                  <Skeleton className="h-9 flex-1 rounded-lg" />
                  <Skeleton className="h-9 flex-1 rounded-lg" />
                </div>
              </article>
            ))}
          </div>
          <div className="hidden p-4 md:block">
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
