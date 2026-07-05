"use client";

import PinPad from "@/components/PinPad";
import { markPinTabUnlocked } from "@/lib/pinTabSession";

interface PinUnlockProps {
  userId: string;
  onSuccess?: () => void;
}

export default function PinUnlock({ userId, onSuccess }: PinUnlockProps) {
  return (
    <main className="min-h-screen bg-background">
      <PinPad
        onSuccess={() => {
          markPinTabUnlocked(userId);
          onSuccess?.();
        }}
      />
    </main>
  );
}
