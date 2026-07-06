"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";
import { signOutAction } from "@/app/actions/authActions";
import { isRedirectError } from "next/dist/client/components/redirect-error";

interface SignOutButtonProps {
  compact?: boolean;
}

export default function SignOutButton({ compact = false }: SignOutButtonProps) {
  const [pending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      try {
        await signOutAction();
      } catch (err) {
        if (!isRedirectError(err)) {
          console.error("SignOutButton:", err);
        }
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={pending}
      className={`inline-flex items-center rounded-xl border border-cardBorder bg-card text-sm font-medium text-zinc-300 transition-colors hover:border-neonCrimson/40 hover:text-neonCrimson disabled:cursor-not-allowed disabled:opacity-60 ${
        compact ? "gap-0 p-2" : "gap-2 px-4 py-2"
      }`}
      aria-label={pending ? "Signing out" : "Sign out"}
    >
      <LogOut className="h-4 w-4 shrink-0" />
      {!compact && (pending ? "Signing out..." : "Sign out")}
    </button>
  );
}
