export const PWA_DISMISS_KEY = "expense-diary-pwa-dismissed";
export const PWA_DISMISS_DAYS = 14;

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function isMobileBrowser(): boolean {
  if (typeof navigator === "undefined") {
    return false;
  }

  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}

export function isPwaDismissed(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    const raw = window.localStorage.getItem(PWA_DISMISS_KEY);
    if (!raw) {
      return false;
    }

    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) {
      return false;
    }

    const elapsedMs = Date.now() - dismissedAt;
    return elapsedMs < PWA_DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function dismissPwaPrompt(): void {
  try {
    window.localStorage.setItem(PWA_DISMISS_KEY, String(Date.now()));
  } catch {
    // Ignore storage failures (private mode, etc.).
  }
}

export async function registerServiceWorker(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  try {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch (error) {
    console.error("PWA service worker registration failed:", error);
  }
}
