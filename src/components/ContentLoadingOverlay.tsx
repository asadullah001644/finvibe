"use client";

import PageRouteSkeleton from "@/components/PageRouteSkeleton";
import { useAppNavigation } from "@/components/NavigationLoadingProvider";

export default function ContentLoadingOverlay() {
  const { isNavigating } = useAppNavigation();

  if (!isNavigating) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      className="absolute inset-0 z-20 min-h-[50vh] bg-[#09090B]/90 pt-2"
    >
      <PageRouteSkeleton />
    </div>
  );
}
