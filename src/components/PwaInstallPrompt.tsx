"use client";

import { Download, MoreVertical, Share, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { APP_NAME } from "@/lib/branding";
import {
  dismissPwaPrompt,
  isIosDevice,
  isMobileBrowser,
  isPwaDismissed,
  isStandaloneDisplayMode,
  registerServiceWorker,
} from "@/lib/pwa";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type PromptMode = "native" | "ios" | "android";

export default function PwaInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<PromptMode>("native");
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [installing, setInstalling] = useState(false);
  const installEventRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandaloneDisplayMode() || isPwaDismissed()) {
      return;
    }

    void registerServiceWorker();

    const showFallback = () => {
      if (isStandaloneDisplayMode() || isPwaDismissed()) {
        return;
      }

      if (installEventRef.current) {
        return;
      }

      if (isIosDevice()) {
        setMode("ios");
        setVisible(true);
        return;
      }

      if (isMobileBrowser()) {
        setMode("android");
        setVisible(true);
      }
    };

    const fallbackTimer = window.setTimeout(showFallback, isIosDevice() ? 1800 : 4500);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      installEventRef.current = promptEvent;
      setInstallEvent(promptEvent);
      setMode("native");
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleDismiss = () => {
    dismissPwaPrompt();
    setVisible(false);
  };

  const handleInstall = async () => {
    if (!installEvent) {
      return;
    }

    setInstalling(true);

    try {
      await installEvent.prompt();
      const choice = await installEvent.userChoice;
      if (choice.outcome === "accepted") {
        setVisible(false);
      } else {
        dismissPwaPrompt();
        setVisible(false);
      }
    } catch (error) {
      console.error("PWA install prompt failed:", error);
    } finally {
      setInstalling(false);
      setInstallEvent(null);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-labelledby="pwa-install-title"
      aria-describedby="pwa-install-description"
      className="fixed inset-x-4 bottom-[5.75rem] z-[45] mx-auto max-w-md lg:bottom-6 lg:right-6 lg:left-auto"
    >
      <div className="rounded-2xl border border-cardBorder bg-[#18181B]/95 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <Image
            src="/icon-192.png"
            alt=""
            width={44}
            height={44}
            className="shrink-0 rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <p
                id="pwa-install-title"
                className="text-sm font-semibold text-zinc-100"
              >
                Install {APP_NAME}
              </p>
              <button
                type="button"
                onClick={handleDismiss}
                className="shrink-0 rounded-lg p-1 text-zinc-500 transition hover:bg-card hover:text-zinc-300"
                aria-label="Dismiss install prompt"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {mode === "ios" ? (
              <p id="pwa-install-description" className="mt-1 text-xs leading-relaxed text-zinc-400">
                Add this app to your home screen: tap{" "}
                <Share className="mx-0.5 inline h-3.5 w-3.5 align-text-bottom text-neonViolet" />{" "}
                Share, then choose <span className="font-medium text-zinc-300">Add to Home Screen</span>.
              </p>
            ) : mode === "android" ? (
              <p id="pwa-install-description" className="mt-1 text-xs leading-relaxed text-zinc-400">
                Install from your browser menu: tap{" "}
                <MoreVertical className="mx-0.5 inline h-3.5 w-3.5 align-text-bottom text-neonViolet" />{" "}
                Menu, then choose <span className="font-medium text-zinc-300">Install app</span> or{" "}
                <span className="font-medium text-zinc-300">Add to Home screen</span>.
              </p>
            ) : (
              <p id="pwa-install-description" className="mt-1 text-xs leading-relaxed text-zinc-400">
                Install on your device for quick access, full-screen use, and a native app feel.
              </p>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          {mode === "native" && installEvent && (
            <button
              type="button"
              onClick={handleInstall}
              disabled={installing}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-neonViolet px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              {installing ? "Installing..." : "Install app"}
            </button>
          )}
          <button
            type="button"
            onClick={handleDismiss}
            className={`rounded-xl border border-cardBorder px-4 py-2.5 text-sm font-medium text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200 ${
              mode === "native" && installEvent ? "" : "flex-1"
            }`}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
