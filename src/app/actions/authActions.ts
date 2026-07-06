"use server";

import { createClient } from "@/utils/supabase/server";
import { ensureSuperAdminRole, isSuperAdminEmail } from "@/lib/auth";
import {
  AUTH_FALLBACK,
  AUTH_MESSAGES,
  AUTH_VALIDATION,
  mapAuthError,
  validateAuthEmail,
  validateAuthPassword,
} from "@/lib/authErrors";
import { clearPinSession, setPinSession, setPinTabBootstrap } from "@/lib/pinSession";
import { getSiteOrigin } from "@/lib/siteOrigin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

const LEGACY_PIN_COOKIE = "finvibe_session";

async function clearLegacyCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(LEGACY_PIN_COOKIE);
}

export async function signInAction(
  email: string,
  password: string,
): Promise<AuthActionResult> {
  const emailError = validateAuthEmail(email);
  if (emailError) {
    return { success: false, error: emailError };
  }

  if (!password) {
    return { success: false, error: AUTH_VALIDATION.passwordRequired };
  }

  const normalizedEmail = email.trim();

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      console.error("signInAction:", error.code, error.message);
      return { success: false, error: mapAuthError(error, "signin") };
    }

    if (data.user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_disabled")
        .eq("id", data.user.id)
        .maybeSingle();

      if (!profileError && profile?.is_disabled) {
        await supabase.auth.signOut();
        return { success: false, error: AUTH_MESSAGES.accountDisabled };
      }

      await ensureSuperAdminRole(data.user.id, data.user.email ?? normalizedEmail);
    }

    await clearLegacyCookies();
    if (data.user) {
      await setPinSession(data.user.id);
      await setPinTabBootstrap(data.user.id);
    }
    redirect("/");
  } catch (err) {
    if (isRedirectError(err)) {
      throw err;
    }
    console.error("signInAction unexpected:", err);
    return { success: false, error: AUTH_FALLBACK.signIn };
  }
}

export async function signUpAction(
  email: string,
  password: string,
  confirmPassword: string,
): Promise<AuthActionResult> {
  const emailError = validateAuthEmail(email);
  if (emailError) {
    return { success: false, error: emailError };
  }

  const passwordError = validateAuthPassword(password);
  if (passwordError) {
    return { success: false, error: passwordError };
  }

  if (password !== confirmPassword) {
    return { success: false, error: AUTH_VALIDATION.passwordMismatch };
  }

  const normalizedEmail = email.trim();

  try {
    const supabase = await createClient();
    const siteOrigin = await getSiteOrigin();
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: `${siteOrigin}/auth/callback`,
      },
    });

    if (error) {
      console.error("signUpAction:", error.code, error.message);
      return { success: false, error: mapAuthError(error, "signup") };
    }

    if (data.user) {
      await ensureSuperAdminRole(data.user.id, data.user.email ?? normalizedEmail);
    }

    if (data.session && data.user) {
      await clearLegacyCookies();
      await setPinSession(data.user.id);
      await setPinTabBootstrap(data.user.id);
      redirect("/");
    }

    if (isSuperAdminEmail(normalizedEmail)) {
      return {
        success: true,
        message: AUTH_MESSAGES.signUpSuperAdminConfirm,
      };
    }

    return { success: true, message: AUTH_MESSAGES.signUpConfirmEmail };
  } catch (err) {
    if (isRedirectError(err)) {
      throw err;
    }
    console.error("signUpAction unexpected:", err);
    return { success: false, error: AUTH_FALLBACK.signUp };
  }
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await clearPinSession();
  await clearLegacyCookies();
  redirect("/login");
}

export async function forgotPasswordAction(email: string): Promise<AuthActionResult> {
  const emailError = validateAuthEmail(email);
  if (emailError) {
    return { success: false, error: emailError };
  }

  try {
    const supabase = await createClient();
    const siteOrigin = await getSiteOrigin();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${siteOrigin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      console.error("forgotPasswordAction:", error.code, error.message);

      if (
        error.code === "over_email_send_rate_limit" ||
        error.code === "over_request_rate_limit" ||
        (error.message ?? "").toLowerCase().includes("rate limit")
      ) {
        return { success: false, error: mapAuthError(error, "forgot") };
      }

      if (
        error.code === "email_address_invalid" ||
        (error.message ?? "").toLowerCase().includes("invalid email")
      ) {
        return { success: false, error: AUTH_VALIDATION.emailInvalid };
      }

      return { success: false, error: mapAuthError(error, "forgot") };
    }

    return { success: true, message: AUTH_MESSAGES.forgotPasswordSuccess };
  } catch (err) {
    console.error("forgotPasswordAction unexpected:", err);
    return { success: false, error: AUTH_FALLBACK.forgotPassword };
  }
}

export async function resetPasswordAction(
  password: string,
  confirmPassword: string,
): Promise<AuthActionResult> {
  const passwordError = validateAuthPassword(password);
  if (passwordError) {
    return { success: false, error: passwordError };
  }

  if (password !== confirmPassword) {
    return { success: false, error: AUTH_VALIDATION.passwordMismatch };
  }

  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return {
        success: false,
        error:
          "Your reset link expired or was already used. Request a new password reset email.",
      };
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error("resetPasswordAction:", error.code, error.message);
      return { success: false, error: mapAuthError(error, "reset") };
    }

    redirect("/login?reset=success");
  } catch (err) {
    if (isRedirectError(err)) {
      throw err;
    }
    console.error("resetPasswordAction unexpected:", err);
    return { success: false, error: AUTH_FALLBACK.resetPassword };
  }
}
