"use client";

import { useState } from "react";
import { signUpAction } from "@/app/actions/authActions";
import { AUTH_FALLBACK } from "@/lib/authErrors";
import AuthShell, {
  AuthError,
  AuthField,
  AuthLink,
  AuthPasswordField,
  AuthSubmitButton,
  AuthSuccess,
} from "@/components/auth/AuthShell";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { APP_NAME } from "@/lib/branding";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);

    try {
      const result = await signUpAction(email, password, confirmPassword);
      if (result.success) {
        setMessage(result.message ?? "Account created.");
      } else {
        setError(result.error ?? AUTH_FALLBACK.signUp);
      }
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err instanceof Error ? err.message : AUTH_FALLBACK.signUp);
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Create account"
      subtitle={
        <>
          Start logging daily expenses with{" "}
          <span className="font-semibold text-zinc-300">{APP_NAME}</span>
        </>
      }
      footer={
        <>
          Already have an account? <AuthLink href="/login">Sign in</AuthLink>
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
        <AuthPasswordField
          id="password"
          label="Password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />
        <AuthPasswordField
          id="confirmPassword"
          label="Confirm password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
        />

        <p className="text-xs text-zinc-500">
          Use at least 8 characters. Avoid common passwords (for example 12345678).
        </p>

        <AuthSubmitButton
          label="Create account"
          pending={pending}
          pendingLabel="Creating account..."
        />
      </form>
    </AuthShell>
  );
}
