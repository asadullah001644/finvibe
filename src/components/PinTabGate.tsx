"use client";

import { useLayoutEffect, useState } from "react";
import { ClearAppShell } from "@/components/AppShellProvider";
import PinUnlock from "@/components/PinUnlock";
import { isPinTabUnlocked, markPinTabUnlocked } from "@/lib/pinTabSession";

interface PinTabGateProps {
  userId: string;
  pinLockEnabled: boolean;
  children: React.ReactNode;
}

export default function PinTabGate({
  userId,
  pinLockEnabled,
  children,
}: PinTabGateProps) {
  const [unlocked, setUnlocked] = useState(
    () => !pinLockEnabled || isPinTabUnlocked(userId),
  );

  useLayoutEffect(() => {
    if (!pinLockEnabled) {
      setUnlocked(true);
      return;
    }

    setUnlocked(isPinTabUnlocked(userId));
  }, [pinLockEnabled, userId]);

  if (!pinLockEnabled || unlocked) {
    return <>{children}</>;
  }

  return (
    <>
      <ClearAppShell />
      <PinUnlock
        userId={userId}
        onSuccess={() => {
          markPinTabUnlocked(userId);
          setUnlocked(true);
        }}
      />
    </>
  );
}
