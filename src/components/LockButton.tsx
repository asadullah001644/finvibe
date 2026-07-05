"use client";

import { Lock } from "lucide-react";
import { useAppNavigation } from "@/components/NavigationLoadingProvider";
import { useState } from "react";
import { lockSession } from "@/app/actions/aiAndAuthActions";
import { clearPinTabUnlock } from "@/lib/pinTabSession";

export default function LockButton() {
  const { refresh } = useAppNavigation();
  const [isLocking, setIsLocking] = useState(false);

  const handleLock = async () => {
    setIsLocking(true);

    try {
      clearPinTabUnlock();
      await lockSession();
      await refresh();
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLock}
      disabled={isLocking}
      className="inline-flex items-center gap-2 rounded-xl border border-cardBorder bg-card px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-neonCrimson/40 hover:text-neonCrimson disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Lock className="h-4 w-4" />
      {isLocking ? "Locking..." : "Lock"}
    </button>
  );
}
