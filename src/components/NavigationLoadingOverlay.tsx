"use client";

import { Loader2 } from "lucide-react";

export default function NavigationLoadingOverlay() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      className="fixed inset-0 z-[300] flex items-center justify-center bg-[#09090B]/70 backdrop-blur-[2px]"
    >
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-cardBorder bg-card/95 px-8 py-6 shadow-[0_0_40px_rgba(139,92,246,0.15)]">
        <Loader2 className="h-8 w-8 animate-spin text-neonViolet" />
        <p className="text-sm text-zinc-400">Loading...</p>
      </div>
    </div>
  );
}
