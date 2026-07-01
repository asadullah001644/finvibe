"use client";

import { Wallet } from "lucide-react";

interface SetupHeroProps {
  monthLabel: string;
  onSetup: () => void;
}

export default function SetupHero({ monthLabel, onSetup }: SetupHeroProps) {
  return (
    <section className="rounded-2xl border border-neonViolet/25 bg-gradient-to-br from-neonViolet/10 via-card/40 to-card/20 p-6 sm:p-8">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-neonViolet/30 bg-neonViolet/10">
          <Wallet className="h-6 w-6 text-neonViolet" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-100">
          Welcome to FinVibe
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Set your {monthLabel} salary and savings goal — takes 30 seconds.
          Then start logging expenses. Category limits are optional and can
          wait.
        </p>
        <button
          type="button"
          onClick={onSetup}
          className="mt-5 inline-flex items-center justify-center rounded-xl border border-neonViolet/40 bg-neonViolet/15 px-6 py-3 text-sm font-semibold text-neonViolet transition-colors hover:bg-neonViolet/25"
        >
          Set {monthLabel} Income
        </button>
      </div>
    </section>
  );
}
