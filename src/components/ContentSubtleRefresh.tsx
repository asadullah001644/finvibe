"use client";

import type { ReactNode } from "react";
import { useAppNavigation } from "@/components/NavigationLoadingProvider";

export default function ContentSubtleRefresh({ children }: { children: ReactNode }) {
  const { isRefreshing } = useAppNavigation();

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-px overflow-hidden transition-opacity duration-200 ${
          isRefreshing ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="h-full w-1/3 animate-pulse bg-neonViolet shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
      </div>

      <div
        className={`transition-opacity duration-200 ${
          isRefreshing ? "opacity-80" : "opacity-100"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
