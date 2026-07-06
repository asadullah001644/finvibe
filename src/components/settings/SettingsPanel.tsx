"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  clearAppPinAction,
  setAppPinAction,
} from "@/app/actions/aiAndAuthActions";
import { signOutAction } from "@/app/actions/authActions";
import { updateDisplayNameAction } from "@/app/actions/profileActions";
import { formatMemberSince, resolveDisplayInitial, resolveDisplayName } from "@/lib/profileDisplay";
import type { Profile } from "@/lib/types";
import { isRedirectError } from "next/dist/client/components/redirect-error";

interface SettingsPanelProps {
  profile: Profile;
  hasPin: boolean;
  isSuperAdmin: boolean;
  profilesReady: boolean;
  displayNameReady: boolean;
}

export default function SettingsPanel({
  profile,
  hasPin,
  isSuperAdmin,
  profilesReady,
  displayNameReady,
}: SettingsPanelProps) {
  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const resolvedName = resolveDisplayName(profile);
  const initial = resolveDisplayInitial(resolvedName);

  function handleSaveDisplayName(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await updateDisplayNameAction(displayName);
      if (result.success) {
        setMessage("Display name updated.");
      } else {
        setError(result.error ?? "Could not save display name.");
      }
    });
  }

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
    <main className="min-h-screen bg-[#09090B] px-4 py-6 pb-28 text-zinc-100 sm:px-6 lg:px-8 lg:py-8 lg:pb-8">
      <div className="mx-auto max-w-3xl space-y-5 sm:space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.3em] text-neonViolet/80">Account</p>
            <h1 className="mt-2 text-2xl font-semibold lg:text-3xl">Settings</h1>
          </div>
          <Link
            href="/"
            className="shrink-0 rounded-xl border border-cardBorder bg-card px-4 py-2 text-sm transition-colors hover:border-neonViolet/40"
          >
            Back
          </Link>
        </div>

        {message && (
          <p className="rounded-xl border border-neonEmerald/30 bg-neonEmerald/10 px-4 py-3 text-sm text-neonEmerald">
            {message}
          </p>
        )}
        {error && (
          <p className="rounded-xl border border-neonCrimson/30 bg-neonCrimson/10 px-4 py-3 text-sm text-neonCrimson">
            {error}
          </p>
        )}

        {!profilesReady && (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
            Database migration required: run{" "}
            <code className="text-xs">003_multi_user_foundation.sql</code> in Supabase SQL editor
            to enable PIN lock and full profile settings.
          </p>
        )}

        {!displayNameReady && profilesReady && (
          <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
            Run <code className="text-xs">006_add_display_name.sql</code> in Supabase to enable
            display names in the header and settings.
          </p>
        )}

        <section className="rounded-2xl border border-cardBorder bg-card p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-neonViolet/30 bg-neonViolet/10 text-lg font-semibold text-neonViolet">
                {initial}
              </div>
              <div>
                <h2 className="text-lg font-medium">{resolvedName}</h2>
                <p className="mt-1 text-sm text-zinc-400">{profile.email}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  Member since {formatMemberSince(profile.createdAt)}
                </p>
                {isSuperAdmin && (
                  <span className="mt-2 inline-flex rounded-full border border-neonViolet/30 bg-neonViolet/10 px-2.5 py-0.5 text-xs font-medium text-neonViolet">
                    Super admin
                  </span>
                )}
              </div>
            </div>
          </div>

          {displayNameReady && (
            <form className="mt-6 space-y-3 border-t border-cardBorder pt-6" onSubmit={handleSaveDisplayName}>
              <label className="block">
                <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-400">
                  Display name
                </span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder={resolvedName}
                  maxLength={50}
                  className="h-11 w-full rounded-xl border border-cardBorder bg-background px-3.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-neonViolet/50"
                />
              </label>
              <p className="text-xs leading-relaxed text-zinc-500">
                Shown in the header and admin list. Leave empty to use your email prefix.
              </p>
              <button
                type="submit"
                disabled={pending}
                className="inline-flex min-h-11 items-center rounded-xl bg-neonViolet px-4 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-60"
              >
                Save name
              </button>
            </form>
          )}
        </section>

        <section className="space-y-4 rounded-2xl border border-cardBorder bg-card p-4 sm:p-5 lg:p-6">
          <div>
            <h2 className="text-lg font-medium">App PIN lock</h2>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">
              Optional 4-digit PIN after sign-in. Stays unlocked until you close the tab or app,
              tap Lock, or sign out. Works in the browser and installed app.
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
              className="inline-flex min-h-11 items-center rounded-xl border border-neonCrimson/30 px-4 py-2.5 text-sm text-neonCrimson transition-colors hover:bg-neonCrimson/10 disabled:opacity-60"
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
                className="h-11 w-full rounded-xl border border-cardBorder bg-background px-3.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-neonViolet/50"
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
                className="h-11 w-full rounded-xl border border-cardBorder bg-background px-3.5 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-neonViolet/50"
              />
              <button
                type="submit"
                disabled={pending}
                className="inline-flex min-h-11 items-center rounded-xl bg-neonViolet px-4 py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-60"
              >
                Enable PIN lock
              </button>
            </form>
          )}
        </section>

        {isSuperAdmin && (
          <section className="rounded-2xl border border-cardBorder bg-card p-4 sm:p-5 lg:p-6">
            <h2 className="text-lg font-medium">Super admin</h2>
            <p className="mt-1 text-sm leading-relaxed text-zinc-400">
              Manage users, view all accounts, and run AI capital audits.
            </p>
            <Link
              href="/admin"
              className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-neonViolet/40 px-4 py-2.5 text-sm text-neonViolet transition-colors hover:bg-neonViolet/10"
            >
              Open admin dashboard
            </Link>
          </section>
        )}

        <section className="rounded-2xl border border-cardBorder bg-card p-4 sm:p-5 lg:p-6">
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
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-cardBorder bg-background px-4 py-2.5 text-sm text-zinc-200 transition-colors hover:border-neonCrimson/30 hover:text-neonCrimson disabled:opacity-60 sm:w-auto"
          >
            Sign out
          </button>
        </section>
      </div>
    </main>
  );
}
