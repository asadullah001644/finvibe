import { cookies } from "next/headers";

export const PIN_SESSION_COOKIE = "finvibe_pin_unlocked";
export const PIN_SESSION_MAX_AGE = 60 * 60 * 24;

export async function isPinSessionValid(userId: string): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(PIN_SESSION_COOKIE)?.value === userId;
}

export async function setPinSession(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PIN_SESSION_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: PIN_SESSION_MAX_AGE,
    path: "/",
  });
}

export async function clearPinSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PIN_SESSION_COOKIE);
}
