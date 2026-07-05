/** Client-safe validation and user-facing auth messages. */

export const AUTH_VALIDATION = {
  emailInvalid: "Enter a valid email address.",
  passwordRequired: "Enter your password.",
  passwordMinLength: "Password must be at least 8 characters.",
  passwordMismatch: "Passwords do not match.",
} as const;

export const AUTH_MESSAGES = {
  signUpConfirmEmail:
    "Account created. Check your email to confirm your address, then sign in.",
  signUpInstant:
    "Account created. You can sign in now.",
  signUpSuperAdminConfirm:
    "Account created. If email confirmation is enabled in Supabase, check your inbox first, then sign in.",
  forgotPasswordSuccess:
    "If an account exists for that email, we sent a password reset link. Check your inbox and spam folder.",
  forgotPasswordRateLimited:
    "Too many reset requests. Wait a few minutes, then try again.",
  resetPasswordSuccessLogin: "Password updated. Sign in with your new password.",
  accountDisabled: "Your account has been disabled. Contact support.",
} as const;

export const AUTH_FALLBACK = {
  signIn: "Could not sign in. Please try again.",
  signUp: "Could not create your account. Please try again.",
  forgotPassword: "Could not send the reset link. Please try again.",
  resetPassword: "Could not update your password. Please try again.",
} as const;

/** Errors passed via URL query on auth pages (e.g. /login?error=...). */
export const AUTH_QUERY_ERRORS: Record<string, string> = {
  auth_callback_failed:
    "That link expired or is invalid. Sign in, or request a new confirmation or reset link.",
  session_expired:
    "Your reset link expired. Request a new password reset email and try again.",
};

const AUTH_ERROR_BY_CODE: Record<string, string> = {
  email_not_confirmed:
    "Confirm your email first. Check your inbox for the confirmation link, then sign in.",
  invalid_credentials:
    "Incorrect email or password. Check your details or create an account if you are new.",
  user_already_exists:
    "An account with this email already exists. Sign in instead, or reset your password.",
  email_exists:
    "An account with this email already exists. Sign in instead, or reset your password.",
  weak_password:
    "Choose a stronger password. Avoid common passwords (for example 12345678).",
  signup_disabled: "New sign ups are disabled. Contact support if you need access.",
  email_address_invalid: AUTH_VALIDATION.emailInvalid,
  over_email_send_rate_limit: AUTH_MESSAGES.forgotPasswordRateLimited,
  over_request_rate_limit: "Too many attempts. Wait a few minutes, then try again.",
  unexpected_failure:
    "We could not finish setting up your account. Try signing in — you may already be registered.",
  flow_state_expired:
    "That link expired. Request a new password reset or confirmation email.",
  otp_expired: "That verification code expired. Request a new link and try again.",
  same_password: "Choose a new password that is different from your current one.",
  session_not_found:
    "Your session expired. Open the reset link from your email again, or request a new one.",
  reauthentication_needed:
    "For security, open the reset link from your email again before changing your password.",
};

export function validateAuthEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) {
    return AUTH_VALIDATION.emailInvalid;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return AUTH_VALIDATION.emailInvalid;
  }
  return null;
}

export function validateAuthPassword(password: string): string | null {
  if (!password) {
    return AUTH_VALIDATION.passwordRequired;
  }
  if (password.length < 8) {
    return AUTH_VALIDATION.passwordMinLength;
  }
  return null;
}

export function getAuthQueryError(code: string | null | undefined): string | null {
  if (!code) {
    return null;
  }
  return AUTH_QUERY_ERRORS[code] ?? null;
}

export type AuthErrorContext = "signin" | "signup" | "forgot" | "reset";

export function mapAuthError(error: unknown, context: AuthErrorContext = "signin"): string {
  if (!error || typeof error !== "object") {
    return fallbackForContext(context);
  }

  const record = error as { message?: string; code?: string; status?: number };
  const message = (record.message ?? "").toLowerCase();
  const code = record.code ?? "";

  if (code && AUTH_ERROR_BY_CODE[code]) {
    return AUTH_ERROR_BY_CODE[code];
  }

  if (message.includes("email not confirmed")) {
    return AUTH_ERROR_BY_CODE.email_not_confirmed;
  }

  if (
    message.includes("invalid login credentials") ||
    message.includes("invalid email or password") ||
    message.includes("invalid credentials")
  ) {
    return context === "signin"
      ? "Incorrect email or password. Check your details or create an account if you are new."
      : AUTH_ERROR_BY_CODE.invalid_credentials;
  }

  if (
    message.includes("user already registered") ||
    message.includes("already been registered") ||
    message.includes("already exists") ||
    (message.includes("already") && message.includes("email"))
  ) {
    return AUTH_ERROR_BY_CODE.user_already_exists;
  }

  if (
    message.includes("weak") ||
    message.includes("easily guessed") ||
    message.includes("pwned") ||
    message.includes("breach") ||
    message.includes("compromised")
  ) {
    return AUTH_ERROR_BY_CODE.weak_password;
  }

  if (message.includes("database error saving new user")) {
    return AUTH_ERROR_BY_CODE.unexpected_failure;
  }

  if (message.includes("password") && message.includes("least")) {
    return AUTH_VALIDATION.passwordMinLength;
  }

  if (
    message.includes("rate limit") ||
    message.includes("too many") ||
    message.includes("security purposes")
  ) {
    return context === "forgot"
      ? AUTH_MESSAGES.forgotPasswordRateLimited
      : AUTH_ERROR_BY_CODE.over_request_rate_limit;
  }

  if (message.includes("signup") && message.includes("disabled")) {
    return AUTH_ERROR_BY_CODE.signup_disabled;
  }

  if (message.includes("flow state") || message.includes("link expired")) {
    return AUTH_ERROR_BY_CODE.flow_state_expired;
  }

  if (message.includes("otp") && message.includes("expired")) {
    return AUTH_ERROR_BY_CODE.otp_expired;
  }

  if (
    message.includes("session") &&
    (message.includes("missing") || message.includes("not found") || message.includes("expired"))
  ) {
    return context === "reset"
      ? "Your reset link expired. Request a new password reset email and try again."
      : AUTH_ERROR_BY_CODE.session_not_found;
  }

  if (message.includes("disabled")) {
    return AUTH_MESSAGES.accountDisabled;
  }

  if (message.includes("invalid") && message.includes("email")) {
    return AUTH_VALIDATION.emailInvalid;
  }

  if (context === "forgot" && record.status === 422) {
    return AUTH_VALIDATION.emailInvalid;
  }

  return fallbackForContext(context);
}

function fallbackForContext(context: AuthErrorContext): string {
  switch (context) {
    case "signup":
      return AUTH_FALLBACK.signUp;
    case "forgot":
      return AUTH_FALLBACK.forgotPassword;
    case "reset":
      return AUTH_FALLBACK.resetPassword;
    default:
      return AUTH_FALLBACK.signIn;
  }
}
