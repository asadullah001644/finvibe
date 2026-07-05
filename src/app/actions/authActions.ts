"use server";

import { createClient } from "@/utils/supabase/server";
import { ensureSuperAdminRole, isSuperAdminEmail } from "@/lib/auth";
import { AUTH_MESSAGES, mapAuthError } from "@/lib/authErrors";
import { clearPinSession } from "@/lib/pinSession";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

const LEGACY_PIN_COOKIE = "finvibe_session";

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  return null;
}

function getOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  );
}

async function clearLegacyCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(LEGACY_PIN_COOKIE);
}

export async function signInAction(
  email: string,
  password: string,
): Promise<AuthActionResult> {
  if (!validateEmail(email)) {
    return { success: false, error: "Enter a valid email address." };
  }

  if (!password) {
    return { success: false, error: "Enter your password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    const mapped = mapAuthError(error);
    if (mapped === "Invalid email or password.") {
      return {
        success: false,
        error: "Invalid email or password. If you are new, create an account first.",
      };
    }
    return { success: false, error: mapped };
  }

  if (data.user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_disabled")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profileError && profile?.is_disabled) {
      await supabase.auth.signOut();
      return { success: false, error: "Your account has been disabled. Contact support." };
    }

    await ensureSuperAdminRole(data.user.id, data.user.email ?? email);
  }

  await clearLegacyCookies();
  await clearPinSession();
  redirect("/");
}

export async function signUpAction(
  email: string,
  password: string,
  confirmPassword: string,
): Promise<AuthActionResult> {
  if (!validateEmail(email)) {
    return { success: false, error: "Enter a valid email address." };
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return { success: false, error: passwordError };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: `${getOrigin()}/auth/callback`,
    },
  });

  if (error) {
    return { success: false, error: mapAuthError(error) };
  }

  if (data.user) {
    await ensureSuperAdminRole(data.user.id, data.user.email ?? email);
  }

  if (data.session) {
    await clearLegacyCookies();
    await clearPinSession();
    redirect("/");
  }

  if (isSuperAdminEmail(email)) {
    return {
      success: true,
      message:
        "Account created. If email confirmation is enabled in Supabase, check your inbox first, then sign in.",
    };
  }

  return { success: true, message: AUTH_MESSAGES.signupConfirmEmail };
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await clearPinSession();
  await clearLegacyCookies();
  redirect("/login");
}

export async function forgotPasswordAction(email: string): Promise<AuthActionResult> {
  if (!validateEmail(email)) {
    return { success: false, error: "Enter a valid email address." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${getOrigin()}/auth/callback?next=/reset-password`,
  });

  if (error) {
    console.error("forgotPasswordAction:", error);
  }

  return { success: true, message: AUTH_MESSAGES.forgotPasswordSuccess };
}

export async function resetPasswordAction(
  password: string,
  confirmPassword: string,
): Promise<AuthActionResult> {
  const passwordError = validatePassword(password);
  if (passwordError) {
    return { success: false, error: passwordError };
  }

  if (password !== confirmPassword) {
    return { success: false, error: "Passwords do not match." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { success: false, error: mapAuthError(error) };
  }

  redirect("/login?reset=success");
}
