"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { resetPasswordAction } from "@/app/actions/authActions";
import { createClient } from "@/utils/supabase/client";
import { AUTH_FALLBACK, AUTH_QUERY_ERRORS } from "@/lib/authErrors";
import AuthShell, {
  AuthError,
  AuthField,
  AuthLink,
  AuthSubmitButton,
} from "@/components/auth/AuthShell";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export default function ResetPasswordPageClient() {
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);

  const queryError =
    searchParams.get("error") === "session_expired"
      ? AUTH_QUERY_ERRORS.session_expired
      : null;

  useEffect(() => {
    let cancelled = false;

    async function checkResetSession() {
      try {
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!cancelled) {
          setSessionReady(Boolean(session));
          if (!session) {
            setError(
              "Open the password reset link from your email on this device. If it expired, request a new one.",
            );
          }
        }
      } finally {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    }

    void checkResetSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const result = await resetPasswordAction(password, confirmPassword);
      if (!result.success) {
        setError(result.error ?? AUTH_FALLBACK.resetPassword);
      }
    } catch (err) {
      if (isRedirectError(err)) throw err;
      setError(err instanceof Error ? err.message : AUTH_FALLBACK.resetPassword);
    } finally {
      setPending(false);
    }
  }

  if (checkingSession) {
    return (
      <AuthShell title="Reset password" subtitle="Checking your reset link...">
        <p className="text-center text-sm text-zinc-500">Loading...</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="Choose a new password for your account"
      footer={
        <>
          <AuthLink href="/login">Back to sign in</AuthLink>
          {" · "}
          <AuthLink href="/forgot-password">Request a new reset link</AuthLink>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {queryError && <AuthError message={queryError} />}
        {error && <AuthError message={error} />}

        <AuthField
          id="password"
          label="New password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          required={sessionReady}
          disabled={!sessionReady}
        />
        <AuthField
          id="confirmPassword"
          label="Confirm new password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="new-password"
          required={sessionReady}
          disabled={!sessionReady}
        />

        <p className="text-xs text-zinc-500">
          Use at least 8 characters. Avoid common passwords (for example 12345678).
        </p>

        <AuthSubmitButton
          label="Update password"
          pending={pending}
          pendingLabel="Updating password..."
          disabled={!sessionReady}
        />
      </form>
    </AuthShell>
  );
}
