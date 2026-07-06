import { Skeleton, SkeletonLine } from "@/components/ui/skeleton";

export default function AdminUserPageSkeleton() {
  return (
    <main
      className="min-h-screen bg-[#09090B] px-3 py-6 pb-10 text-zinc-100 sm:px-4 sm:py-8"
      aria-busy="true"
      aria-label="Loading user data"
    >
      <div className="mx-auto max-w-5xl space-y-5 sm:space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <SkeletonLine className="w-20" />
            <Skeleton className="h-8 w-40" />
            <SkeletonLine className="w-48" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-11 w-full rounded-xl sm:w-36" />
        </div>

        <section className="rounded-2xl border border-[#27272A] bg-[#18181B] p-4">
          <SkeletonLine className="w-16" />
          <Skeleton className="mt-3 h-10 w-full rounded-xl sm:max-w-xs" />
        </section>

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-[#27272A] bg-[#18181B] p-4">
              <SkeletonLine className="w-20" />
              <Skeleton className="mt-2 h-7 w-24" />
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#27272A] bg-[#18181B]">
          <div className="border-b border-[#27272A] px-4 py-3">
            <SkeletonLine className="w-24" />
          </div>
          <div className="space-y-3 p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
