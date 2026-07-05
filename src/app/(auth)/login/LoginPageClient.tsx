"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInAction } from "@/app/actions/authActions";
import { createClient } from "@/utils/supabase/client";
import {
  AUTH_FALLBACK,
  AUTH_MESSAGES,
  getAuthQueryError,
} from "@/lib/authErrors";
import AuthShell, {
  AuthError,
  AuthField,
  AuthLink,
  AuthSubmitButton,
  AuthSuccess,
} from "@/components/auth/AuthShell";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export default function LoginPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const resetSuccess = searchParams.get("reset") === "success";
  const disabled = searchParams.get("disabled") === "1";
  const queryError = getAuthQueryError(searchParams.get("error"));

  useEffect(() => {
    let cancelled = false;

    async function checkExistingSession() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!cancelled && session?.user && !disabled) {
          router.replace("/");
          return;
        }
      } finally {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    }

    void checkExistingSession();

    return () => {
      cancelled = true;
    };
  }, [disabled, router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const result = await signInAction(email, password);
      if (!result.success) {
        setError(result.error ?? AUTH_FALLBACK.signIn);
      }
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err instanceof Error ? err.message : AUTH_FALLBACK.signIn);
    } finally {
      setPending(false);
    }
  }

  if (checkingSession) {
    return (
      <AuthShell title="Welcome back" subtitle="Checking your session...">
        <p className="text-center text-sm text-zinc-500">Loading...</p>
      </AuthShell>
    );
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
        {resetSuccess && (
          <AuthSuccess message={AUTH_MESSAGES.resetPasswordSuccessLogin} />
        )}
        {disabled && <AuthError message={AUTH_MESSAGES.accountDisabled} />}
        {queryError && <AuthError message={queryError} />}
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

        <AuthSubmitButton label="Sign in" pending={pending} pendingLabel="Signing in..." />
      </form>
    </AuthShell>
  );
}
