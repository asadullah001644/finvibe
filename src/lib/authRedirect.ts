import { getProfileOrDefault, getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Auth pages (login/signup/forgot) should not render for signed-in users.
 * Disabled accounts may still see login (e.g. ?disabled=1).
 */
export async function redirectIfAuthenticatedFromAuthPage(): Promise<void> {
  const user = await getSessionUser();
  if (!user) {
    return;
  }

  const profile = await getProfileOrDefault(user);
  if (profile.isDisabled) {
    return;
  }

  redirect("/");
}
