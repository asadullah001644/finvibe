"use client";

import { useState } from "react";
import { Download, Loader2, Share } from "lucide-react";
import { usePwaInstall } from "@/lib/usePwaInstall";

interface InstallAppButtonProps {
  onActivate?: () => void;
}

export default function InstallAppButton({ onActivate }: InstallAppButtonProps) {
  const { canInstall, canShowIosHint, isInstalling, isVisible, install } =
    usePwaInstall();
  const [showIosHint, setShowIosHint] = useState(false);

  if (!isVisible) {
    return null;
  }

  const handleClick = async () => {
    if (canInstall) {
      onActivate?.();
      await install();
      return;
    }

    setShowIosHint((current) => !current);
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={isInstalling}
        aria-busy={isInstalling}
        aria-expanded={canShowIosHint ? showIosHint : undefined}
        className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-card/60 hover:text-neonEmerald disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isInstalling ? (
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-neonEmerald" aria-hidden="true" />
        ) : canShowIosHint ? (
          <Share className="h-5 w-5 shrink-0 text-neonEmerald" />
        ) : (
          <Download className="h-5 w-5 shrink-0 text-neonEmerald" />
        )}
        Install App
      </button>

      {canShowIosHint && showIosHint && (
        <p className="mt-2 px-3 text-xs leading-relaxed text-zinc-500">
          In Safari, tap the Share button, then choose{" "}
          <span className="font-medium text-zinc-300">Add to Home Screen</span>.
        </p>
      )}
    </div>
  );
}
