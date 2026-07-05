import { ClearAppShell } from "@/components/AppShellProvider";
import PinUnlock from "@/components/PinUnlock";
import { getProfileOrDefault, getSessionUser } from "@/lib/auth";
import { resolveMonthKey } from "@/lib/month";
import { loadMonthShellData } from "@/lib/loadMonthData";
import { isPinSessionValid } from "@/lib/pinSession";
import { redirect } from "next/navigation";

interface MonthSearchParams {
  month?: string;
}

export type ShellGateState =
  | { state: "pin_required" }
  | {
      state: "ready";
      monthKey: string;
      monthLabel: string;
      carriedFromMonthLabel?: string;
      budget: Awaited<ReturnType<typeof loadMonthShellData>>["budget"];
      isSuperAdmin: boolean;
      pinLockEnabled: boolean;
    };

export async function getAuthenticatedShellData(
  searchParams: Promise<MonthSearchParams>,
): Promise<ShellGateState> {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfileOrDefault(user);

  if (profile.isDisabled) {
    redirect("/login?disabled=1");
  }

  const pinLockEnabled = Boolean(profile.appPinHash);

  if (pinLockEnabled) {
    const pinValid = await isPinSessionValid(user.id);
    if (!pinValid) {
      return { state: "pin_required" };
    }
  }

  const params = await searchParams;
  const monthKey = resolveMonthKey(params.month);
  const data = await loadMonthShellData(monthKey);

  return {
    state: "ready",
    ...data,
    isSuperAdmin: profile.role === "super_admin",
    pinLockEnabled,
  };
}

export function AuthGate({
  gateState,
  children,
}: {
  gateState: ShellGateState;
  children: React.ReactNode;
}) {
  if (gateState.state === "pin_required") {
    return (
      <>
        <ClearAppShell />
        <PinUnlock />
      </>
    );
  }

  return <>{children}</>;
}
