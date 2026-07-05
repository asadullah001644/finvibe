import { ClearAppShell } from "@/components/AppShellProvider";
import PinUnlock from "@/components/PinUnlock";
import { getProfileOrDefault, getSessionUser, isSuperAdmin } from "@/lib/auth";
import { resolveMonthKey } from "@/lib/month";
import { loadMonthShellData } from "@/lib/loadMonthData";
import { isPinSessionValid } from "@/lib/pinSession";
import type { Profile } from "@/lib/types";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

interface MonthSearchParams {
  month?: string;
}

export type AppAuthGateState =
  | { state: "pin_required" }
  | {
      state: "ready";
      user: User;
      profile: Profile;
      pinLockEnabled: boolean;
      isSuperAdmin: boolean;
    };

export async function getAppAuthGate(): Promise<AppAuthGateState> {
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

  return {
    state: "ready",
    user,
    profile,
    pinLockEnabled,
    isSuperAdmin: isSuperAdmin(profile),
  };
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
  const [gate, params] = await Promise.all([getAppAuthGate(), searchParams]);

  if (gate.state === "pin_required") {
    return { state: "pin_required" };
  }

  const monthKey = resolveMonthKey(params.month);
  const data = await loadMonthShellData(monthKey);

  return {
    state: "ready",
    ...data,
    isSuperAdmin: gate.isSuperAdmin,
    pinLockEnabled: gate.pinLockEnabled,
  };
}

export function AuthGate({
  gateState,
  children,
}: {
  gateState: AppAuthGateState | ShellGateState;
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
