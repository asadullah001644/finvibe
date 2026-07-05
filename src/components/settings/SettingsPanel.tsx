"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  clearAppPinAction,
  setAppPinAction,
} from "@/app/actions/aiAndAuthActions";
import { signOutAction } from "@/app/actions/authActions";
import { isRedirectError } from "next/dist/client/components/redirect-error";

interface SettingsPanelProps {
  hasPin: boolean;
  isSuperAdmin: boolean;
  profilesReady: boolean;
}

export default function SettingsPanel({
  hasPin,
  isSuperAdmin,
  profilesReady,
}: SettingsPanelProps) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSetPin(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (pin !== confirmPin) {
      setError("PIN codes do not match.");
      return;
    }

    startTransition(async () => {
      const result = await setAppPinAction(pin);
      if (result.success) {
        setMessage("App PIN enabled.");
        setPin("");
        setConfirmPin("");
      } else {
        setError(result.error ?? "Could not save PIN.");
      }
    });
  }

  function handleClearPin() {
    startTransition(async () => {
      const result = await clearAppPinAction();
      if (result.success) {
        setMessage("App PIN removed.");
        setError(null);
      } else {
        setError(result.error ?? "Could not remove PIN.");
      }
    });
  }

  return (
    <main className="min-h-screen bg-[#09090B] px-4 py-8 text-zinc-100">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#8B5CF6]/80">Account</p>
            <h1 className="mt-2 text-2xl font-semibold">Settings</h1>
          </div>
          <Link href="/" className="rounded-xl border border-[#27272A] px-4 py-2 text-sm">
            Back
          </Link>
        </div>

        {message && (
          <p className="rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-3 text-sm text-[#10B981]">
            {message}
          </p>
        )}
        {error && (
          <p className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#EF4444]">
            {error}
          </p>
        )}

        {!profilesReady && (
          <p className="rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-4 py-3 text-sm text-[#F59E0B]">
            Database migration required: run{" "}
            <code className="text-xs">003_multi_user_foundation.sql</code> in Supabase SQL
            editor to enable PIN lock and full profile settings.
          </p>
        )}

        <section className="rounded-2xl border border-[#27272A] bg-[#18181B] p-5 space-y-4">
          <div>
            <h2 className="text-lg font-medium">App PIN lock</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Optional 4-digit PIN shown after sign-in on this device.
            </p>
          </div>

          {!profilesReady ? (
            <p className="text-sm text-zinc-500">
              PIN lock becomes available after the profiles migration is applied.
            </p>
          ) : hasPin ? (
            <button
              type="button"
              disabled={pending}
              onClick={handleClearPin}
              className="rounded-xl border border-[#EF4444]/30 px-4 py-2 text-sm text-[#EF4444]"
            >
              Remove PIN lock
            </button>
          ) : (
            <form className="space-y-3" onSubmit={handleSetPin}>
              <input
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="4-digit PIN"
                className="w-full rounded-xl border border-[#27272A] bg-[#09090B] px-3 py-2 text-sm"
              />
              <input
                inputMode="numeric"
                pattern="\d{4}"
                maxLength={4}
                value={confirmPin}
                onChange={(event) =>
                  setConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 4))
                }
                placeholder="Confirm PIN"
                className="w-full rounded-xl border border-[#27272A] bg-[#09090B] px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={pending}
                className="rounded-xl bg-[#8B5CF6] px-4 py-2 text-sm font-medium disabled:opacity-60"
              >
                Enable PIN lock
              </button>
            </form>
          )}
        </section>

        {isSuperAdmin && (
          <section className="rounded-2xl border border-[#27272A] bg-[#18181B] p-5">
            <h2 className="text-lg font-medium">Super admin</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Manage users, view all accounts, and run AI capital audits.
            </p>
            <Link
              href="/admin"
              className="mt-4 inline-flex rounded-xl border border-[#8B5CF6]/40 px-4 py-2 text-sm text-[#8B5CF6]"
            >
              Open admin dashboard
            </Link>
          </section>
        )}

        <section className="rounded-2xl border border-[#27272A] bg-[#18181B] p-5">
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                try {
                  await signOutAction();
                } catch (err) {
                  if (!isRedirectError(err)) {
                    setError("Could not sign out. Please try again.");
                  }
                }
              })
            }
            className="rounded-xl border border-[#27272A] px-4 py-2 text-sm text-zinc-200"
          >
            Sign out
          </button>
        </section>
      </div>
    </main>
  );
}
