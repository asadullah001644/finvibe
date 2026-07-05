"use client";

import { useLayoutEffect, useState } from "react";
import { ClearAppShell } from "@/components/AppShellProvider";
import PinUnlock from "@/components/PinUnlock";
import {
  isPinTabAccessGranted,
  markPinTabUnlocked,
} from "@/lib/pinTabSession";

interface PinTabGateProps {
  userId: string;
  pinLockEnabled: boolean;
  children: React.ReactNode;
}

type PinTabStatus = "checking" | "locked" | "unlocked";

export default function PinTabGate({
  userId,
  pinLockEnabled,
  children,
}: PinTabGateProps) {
  // "checking" matches server + first client paint — never assume locked (avoids PIN flash).
  const [status, setStatus] = useState<PinTabStatus>(
    pinLockEnabled ? "checking" : "unlocked",
  );

  useLayoutEffect(() => {
    if (!pinLockEnabled) {
      setStatus("unlocked");
      return;
    }

    setStatus(isPinTabAccessGranted(userId) ? "unlocked" : "locked");
  }, [pinLockEnabled, userId]);

  if (status === "unlocked") {
    return <>{children}</>;
  }

  if (status === "checking") {
    return <div className="min-h-screen bg-background" aria-busy="true" aria-label="Loading" />;
  }

  return (
    <>
      <ClearAppShell />
      <PinUnlock
        userId={userId}
        onSuccess={() => {
          markPinTabUnlocked(userId);
          setStatus("unlocked");
        }}
      />
    </>
  );
}
