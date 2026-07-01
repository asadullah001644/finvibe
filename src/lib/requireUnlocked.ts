import { cookies } from "next/headers";

export async function isSessionUnlocked(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("finvibe_session");
  return session?.value === "unlocked";
}
