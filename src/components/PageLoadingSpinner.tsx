import { Loader2 } from "lucide-react";

interface PageLoadingSpinnerProps {
  label?: string;
  fullscreen?: boolean;
}

export default function PageLoadingSpinner({
  label = "Loading",
  fullscreen = true,
}: PageLoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={
        fullscreen
          ? "flex min-h-screen flex-col items-center justify-center gap-3 bg-[#09090B]"
          : "flex flex-col items-center justify-center gap-3 py-16"
      }
    >
      <Loader2 className="h-8 w-8 animate-spin text-neonViolet" />
      <p className="text-sm text-zinc-500">{label}</p>
    </div>
  );
}
