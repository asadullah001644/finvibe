"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import AppLogo from "@/components/AppLogo";
import { APP_NAME, APP_TAGLINE } from "@/lib/branding";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090B] px-4 py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.14),transparent_70%)]" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex w-fit flex-col items-center">
            <AppLogo size="lg" />
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.28em] text-[#8B5CF6]/80">
              {APP_NAME}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">{APP_TAGLINE}</p>
          </div>
          <h1 className="mt-6 text-2xl font-semibold text-zinc-100">{title}</h1>
          <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>
        </div>

        <div className="rounded-2xl border border-[#27272A] bg-[#18181B]/90 p-6 shadow-[0_0_40px_rgba(139,92,246,0.08)] backdrop-blur">
          {children}
        </div>

        {footer && <div className="mt-6 text-center text-sm text-zinc-500">{footer}</div>}
      </div>
    </main>
  );
}

interface AuthFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
}

export function AuthField({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  required = true,
  disabled = false,
}: AuthFieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-400">
        {label}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required={required}
        disabled={disabled}
        className="w-full rounded-xl border border-[#27272A] bg-[#09090B] px-4 py-3 text-sm text-zinc-100 outline-none transition focus:border-[#8B5CF6]/60 focus:ring-2 focus:ring-[#8B5CF6]/20 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </label>
  );
}

export function AuthError({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-4 py-3 text-sm text-[#EF4444]" role="alert">
      {message}
    </p>
  );
}

export function AuthSuccess({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-3 text-sm text-[#10B981]" role="status">
      {message}
    </p>
  );
}

export function AuthSubmitButton({
  label,
  pendingLabel = "Please wait...",
  pending,
  disabled = false,
}: {
  label: string;
  pendingLabel?: string;
  pending: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="w-full rounded-xl bg-[#8B5CF6] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#7C3AED] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

export function AuthLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="font-medium text-[#8B5CF6] hover:text-[#A78BFA]">
      {children}
    </Link>
  );
}
