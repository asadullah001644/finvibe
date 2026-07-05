"use client";

import { Loader2 } from "lucide-react";
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
      className="absolute inset-0 z-20 flex items-start justify-center bg-[#09090B]/60 pt-24 backdrop-blur-[1px]"
    >
      <div className="flex items-center gap-2 rounded-full border border-cardBorder/80 bg-card/90 px-4 py-2 shadow-lg">
        <Loader2 className="h-4 w-4 animate-spin text-neonViolet" />
        <span className="text-sm text-zinc-400">Loading</span>
      </div>
    </div>
  );
}
