"use client";

import { useState } from "react";
import { forgotPasswordAction } from "@/app/actions/authActions";
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

    const result = await forgotPasswordAction(email);
    setPending(false);

    if (result.success) {
      setMessage(result.message ?? "Reset link sent.");
    } else {
      setError(result.error ?? "Could not send reset link.");
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

        <AuthSubmitButton label="Send reset link" pending={pending} />
      </form>
    </AuthShell>
  );
}
