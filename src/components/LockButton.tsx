"use client";

import { Lock } from "lucide-react";
import { useAppNavigation } from "@/components/NavigationLoadingProvider";
import { useState } from "react";
import { lockSession } from "@/app/actions/aiAndAuthActions";
import { clearPinTabUnlock } from "@/lib/pinTabSession";

interface LockButtonProps {
  compact?: boolean;
}

export default function LockButton({ compact = false }: LockButtonProps) {
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
      className={`inline-flex items-center rounded-xl border border-cardBorder bg-card text-sm font-medium text-zinc-300 transition-colors hover:border-neonCrimson/40 hover:text-neonCrimson disabled:cursor-not-allowed disabled:opacity-60 ${
        compact ? "h-11 w-11 justify-center gap-0 p-0 lg:h-auto lg:w-auto lg:p-2" : "gap-2 px-4 py-2"
      }`}
      aria-label={isLocking ? "Locking session" : "Lock session"}
    >
      <Lock className="h-5 w-5 shrink-0 lg:h-4 lg:w-4" />
      {!compact && (isLocking ? "Locking..." : "Lock")}
    </button>
  );
}
