export const PIN_TAB_BOOTSTRAP_COOKIE = "finvibe_pin_tab_bootstrap";

const STORAGE_PREFIX = "finvibe_pin_tab_unlocked";

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

export function isPinTabUnlocked(userId: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return sessionStorage.getItem(storageKey(userId)) === "1";
  } catch {
    return false;
  }
}

export function markPinTabUnlocked(userId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    sessionStorage.setItem(storageKey(userId), "1");
  } catch {
    // Private browsing or storage quota — ignore.
  }
}

export function clearPinTabUnlock(userId?: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (userId) {
      sessionStorage.removeItem(storageKey(userId));
      return;
    }

    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(`${STORAGE_PREFIX}:`)) {
        sessionStorage.removeItem(key);
      }
    }
  } catch {
    // Ignore storage errors.
  }
}

export function readPinTabBootstrapUserId(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const prefix = `${PIN_TAB_BOOTSTRAP_COOKIE}=`;
  const match = document.cookie.split("; ").find((row) => row.startsWith(prefix));

  if (!match) {
    return null;
  }

  return decodeURIComponent(match.slice(prefix.length));
}

export function clearPinTabBootstrapCookie(): void {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${PIN_TAB_BOOTSTRAP_COOKIE}=; Max-Age=0; path=/`;
}
