import { Suspense } from "react";
import PinUnlock from "@/components/PinUnlock";
import { resolveMonthKey } from "@/lib/month";
import { loadMonthData } from "@/lib/loadMonthData";
import { isSessionUnlocked } from "@/lib/requireUnlocked";

interface MonthSearchParams {
  month?: string;
}

export async function getAuthenticatedMonthPageData(
  searchParams: Promise<MonthSearchParams>,
) {
  if (!(await isSessionUnlocked())) {
    return { locked: true as const };
  }

  const params = await searchParams;
  const monthKey = resolveMonthKey(params.month);
  const data = await loadMonthData(monthKey);

  return { locked: false as const, ...data };
}

export function PageLoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090B] text-sm text-zinc-500">
      Loading...
    </div>
  );
}

export function AuthGate({
  locked,
  children,
}: {
  locked: boolean;
  children: React.ReactNode;
}) {
  if (locked) {
    return <PinUnlock />;
  }

  return <>{children}</>;
}

export function ClientSuspense({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoadingFallback />}>{children}</Suspense>;
}
