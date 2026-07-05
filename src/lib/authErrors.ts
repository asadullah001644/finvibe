export function mapAuthError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Something went wrong. Please try again.";
  }

  const record = error as { message?: string; code?: string };
  const message = (record.message ?? "").toLowerCase();
  const code = record.code ?? "";

  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }

  if (
    message.includes("invalid login credentials") ||
    message.includes("invalid email or password")
  ) {
    return "Invalid email or password.";
  }

  if (message.includes("user already registered") || message.includes("already been registered")) {
    return "Could not create account. Try signing in or resetting your password.";
  }

  if (message.includes("password") && message.includes("least")) {
    return "Password must be at least 8 characters.";
  }

  if (message.includes("rate limit") || message.includes("too many")) {
    return "Too many attempts. Please wait and try again.";
  }

  if (message.includes("disabled")) {
    return "Your account has been disabled. Contact support.";
  }

  return "Something went wrong. Please try again.";
}

export const AUTH_MESSAGES = {
  forgotPasswordSuccess:
    "If an account exists for that email, a reset link has been sent.",
  resetPasswordSuccess: "Password updated. You can sign in now.",
  signupConfirmEmail: "Check your email to confirm your account, then sign in.",
} as const;
