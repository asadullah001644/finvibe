import { PIN_TAB_BOOTSTRAP_COOKIE } from "@/lib/pinTabSession";
import { cookies } from "next/headers";

export const PIN_SESSION_COOKIE = "finvibe_pin_unlocked";
export { PIN_TAB_BOOTSTRAP_COOKIE };

export async function isPinSessionValid(userId: string): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(PIN_SESSION_COOKIE)?.value === userId;
}

/** Browser-session cookie (shared across tabs). Per-tab unlock uses sessionStorage. */
export async function setPinSession(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PIN_SESSION_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function clearPinSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PIN_SESSION_COOKIE);
}

/** One-time signal so the login tab can skip PIN without unlocking other tabs. */
export async function setPinTabBootstrap(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PIN_TAB_BOOTSTRAP_COOKIE, userId, {
    maxAge: 30,
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}
