"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { signInAction } from "@/app/actions/authActions";
import AuthShell, {
  AuthError,
  AuthField,
  AuthLink,
  AuthSubmitButton,
  AuthSuccess,
} from "@/components/auth/AuthShell";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export default function LoginPageClient() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const resetSuccess = searchParams.get("reset") === "success";
  const disabled = searchParams.get("disabled") === "1";

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const result = await signInAction(email, password);
      if (!result.success) {
        setError(result.error ?? "Sign in failed.");
      }
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your FinVibe account"
      footer={
        <>
          No account yet? <AuthLink href="/signup">Create one</AuthLink>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {resetSuccess && <AuthSuccess message="Password updated. Sign in with your new password." />}
        {disabled && (
          <AuthError message="Your account has been disabled. Contact support." />
        )}
        {error && <AuthError message={error} />}

        <AuthField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
        />

        <div className="text-right">
          <AuthLink href="/forgot-password">Forgot password?</AuthLink>
        </div>

        <AuthSubmitButton label="Sign in" pending={pending} />
      </form>
    </AuthShell>
  );
}
