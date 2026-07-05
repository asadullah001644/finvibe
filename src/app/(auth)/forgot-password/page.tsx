"use client";

import { useState } from "react";
import { forgotPasswordAction } from "@/app/actions/authActions";
import { AUTH_FALLBACK } from "@/lib/authErrors";
import AuthShell, {
  AuthError,
  AuthField,
  AuthLink,
  AuthSubmitButton,
  AuthSuccess,
} from "@/components/auth/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);

    try {
      const result = await forgotPasswordAction(email);
      if (result.success) {
        setMessage(result.message ?? "Reset link sent.");
      } else {
        setError(result.error ?? AUTH_FALLBACK.forgotPassword);
      }
    } catch {
      setError(AUTH_FALLBACK.forgotPassword);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We will email you a reset link"
      footer={
        <>
          Remember your password? <AuthLink href="/login">Sign in</AuthLink>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && <AuthError message={error} />}
        {message && <AuthSuccess message={message} />}

        <AuthField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />

        <AuthSubmitButton
          label="Send reset link"
          pending={pending}
          pendingLabel="Sending link..."
        />
      </form>
    </AuthShell>
  );
}
