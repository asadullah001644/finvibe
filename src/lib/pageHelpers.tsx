import { ClearAppShell } from "@/components/AppShellProvider";
import PinUnlock from "@/components/PinUnlock";
import { resolveMonthKey } from "@/lib/month";
import { loadMonthShellData } from "@/lib/loadMonthData";
import { isSessionUnlocked } from "@/lib/requireUnlocked";

interface MonthSearchParams {
  month?: string;
}

export async function getAuthenticatedShellData(
  searchParams: Promise<MonthSearchParams>,
) {
  if (!(await isSessionUnlocked())) {
    return { locked: true as const };
  }

  const params = await searchParams;
  const monthKey = resolveMonthKey(params.month);
  const data = await loadMonthShellData(monthKey);

  return { locked: false as const, ...data };
}

export function AuthGate({
  locked,
  children,
}: {
  locked: boolean;
  children: React.ReactNode;
}) {
  if (locked) {
    return (
      <>
        <ClearAppShell />
        <PinUnlock />
      </>
    );
  }

  return <>{children}</>;
}
