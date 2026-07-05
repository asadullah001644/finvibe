import { getProfileOrDefault, getSessionUser } from "@/lib/auth";
import { isPinSessionValid } from "@/lib/pinSession";

export async function isActionSessionValid(): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) {
    return false;
  }

  const profile = await getProfileOrDefault(user);
  if (profile.isDisabled) {
    return false;
  }

  if (profile.appPinHash) {
    return isPinSessionValid(user.id);
  }

  return true;
}

export function actionSessionError(): { success: false; error: string } {
  return {
    success: false,
    error: "Session expired. Sign in again or unlock with your PIN.",
  };
}
