"use client";

import { useAppNavigation } from "@/components/NavigationLoadingProvider";

export default function NavigationProgressBar() {
  const { isNavigating } = useAppNavigation();

  if (!isNavigating) {
    return null;
  }

  return (
    <div
      role="progressbar"
      aria-label="Loading page"
      aria-busy="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px] overflow-hidden bg-neonViolet/10"
    >
      <div className="nav-progress-bar h-full w-full bg-gradient-to-r from-transparent via-neonViolet to-neonEmerald shadow-[0_0_12px_rgba(139,92,246,0.65)]" />
    </div>
  );
}
