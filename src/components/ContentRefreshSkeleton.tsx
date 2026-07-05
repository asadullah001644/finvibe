"use client";

import { useAppNavigation } from "@/components/NavigationLoadingProvider";

export default function ContentRefreshSkeleton() {
  const { isNavigating } = useAppNavigation();

  if (!isNavigating) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 space-y-4"
    >
      <div className="h-28 animate-pulse rounded-2xl bg-card/80" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 animate-pulse rounded-xl bg-card/70" />
        <div className="h-20 animate-pulse rounded-xl bg-card/70" />
      </div>
      <div className="space-y-3">
        <div className="h-16 animate-pulse rounded-2xl bg-card/60" />
        <div className="h-16 animate-pulse rounded-2xl bg-card/60" />
        <div className="h-16 animate-pulse rounded-2xl bg-card/60" />
      </div>
    </div>
  );
}
