import { Skeleton, SkeletonLine } from "@/components/ui/skeleton";

export default function SettingsPageSkeleton() {
  return (
    <main
      className="min-h-screen bg-[#09090B] px-4 py-6 pb-28 text-zinc-100 sm:px-6 lg:px-8 lg:py-8 lg:pb-8"
      aria-busy="true"
      aria-label="Loading settings"
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <SkeletonLine className="w-16" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-10 w-20 rounded-xl" />
        </div>

        <section className="rounded-2xl border border-cardBorder bg-card p-4 sm:p-5 lg:p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-36" />
              <SkeletonLine className="w-44" />
              <SkeletonLine className="w-28" />
            </div>
          </div>
          <div className="mt-6 space-y-3 border-t border-cardBorder pt-6">
            <SkeletonLine className="w-24" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-9 w-24 rounded-xl" />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-cardBorder bg-card p-4 sm:p-5 lg:p-6">
          <Skeleton className="h-6 w-28" />
          <SkeletonLine className="w-full max-w-lg" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </section>

        <Skeleton className="h-11 w-full rounded-xl" />
      </div>
    </main>
  );
}
