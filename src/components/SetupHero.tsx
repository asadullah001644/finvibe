"use client";

import AppLogo from "@/components/AppLogo";
import { APP_NAME } from "@/lib/branding";

interface SetupHeroProps {
  onSetup: () => void;
}

export default function SetupHero({ onSetup }: SetupHeroProps) {
  return (
    <section className="rounded-2xl border border-neonViolet/25 bg-gradient-to-br from-neonViolet/10 via-card/40 to-card/20 p-6 sm:p-8">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto mb-4 flex justify-center">
          <AppLogo size="lg" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-100">
          Welcome to {APP_NAME}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Set your salary and savings goal for this month — takes 30 seconds.
          Then start logging expenses. Category limits are optional and can
          wait.
        </p>
        <button
          type="button"
          onClick={onSetup}
          className="mt-5 inline-flex items-center justify-center rounded-xl border border-neonViolet/40 bg-neonViolet/15 px-6 py-3 text-sm font-semibold text-neonViolet transition-colors hover:bg-neonViolet/25"
        >
          Set Income
        </button>
      </div>
    </section>
  );
}
