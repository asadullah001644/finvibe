import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

interface LoadingButtonContentProps {
  isLoading: boolean;
  children: ReactNode;
  loadingLabel?: string;
}

export function LoadingButtonContent({
  isLoading,
  children,
  loadingLabel = "Loading",
}: LoadingButtonContentProps) {
  if (!isLoading) {
    return children;
  }

  return (
    <>
      <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
      <span className="sr-only">{loadingLabel}</span>
      {children}
    </>
  );
}
