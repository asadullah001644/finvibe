export const PWA_DISMISS_KEY = "expense-diary-pwa-dismissed";
export const PWA_SESSION_SHOWN_KEY = "expense-diary-pwa-shown";

declare global {
  interface Window {
    __expenseDiarySwRegistered?: boolean;
    __expenseDiaryInstallPrompt?: Event;
  }
}

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

    if (raw === "1") {
      return true;
    }

    const dismissedAt = Number(raw);
    if (Number.isFinite(dismissedAt)) {
      return true;
    }

    return true;
  } catch {
    return true;
  }
}

export function wasPwaShownThisSession(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    return window.sessionStorage.getItem(PWA_SESSION_SHOWN_KEY) === "1";
  } catch {
    return true;
  }
}

export function shouldShowPwaPrompt(): boolean {
  if (!isMobileBrowser()) {
    return false;
  }

  if (isStandaloneDisplayMode() || isPwaDismissed() || wasPwaShownThisSession()) {
    return false;
  }

  return true;
}

export function markPwaShownThisSession(): void {
  try {
    window.sessionStorage.setItem(PWA_SESSION_SHOWN_KEY, "1");
  } catch {
    // Ignore storage failures.
  }
}

export function dismissPwaPrompt(): void {
  markPwaShownThisSession();

  try {
    window.localStorage.setItem(PWA_DISMISS_KEY, "1");
  } catch {
    // Ignore storage failures.
  }
}

export async function registerServiceWorker(): Promise<void> {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator) ||
    window.__expenseDiarySwRegistered
  ) {
    return;
  }

  window.__expenseDiarySwRegistered = true;

  try {
    await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  } catch (error) {
    window.__expenseDiarySwRegistered = false;
    console.error("PWA service worker registration failed:", error);
  }
}
