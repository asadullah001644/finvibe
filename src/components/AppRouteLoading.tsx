import { Loader2 } from "lucide-react";

export default function AppRouteLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading page"
      className="flex min-h-[50vh] items-start justify-center pt-24"
    >
      <div className="flex items-center gap-2 rounded-full border border-cardBorder/80 bg-card px-4 py-2 shadow-lg">
        <Loader2 className="h-4 w-4 animate-spin text-neonViolet" />
        <span className="text-sm text-zinc-400">Loading</span>
      </div>
    </div>
  );
}
