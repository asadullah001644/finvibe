"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Wallet, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { getPriorMonthBudgetAction, saveIncomeAction } from "@/lib/actions";
import { formatMonthLabel } from "@/lib/month";
import { formatCurrency } from "@/lib/currency";

interface IncomeSettingsProps {
  monthKey: string;
  monthLabel: string;
  totalSalary: number;
  savingsGoal: number;
  carriedFromMonthLabel?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

function hasIncomeValues(totalSalary: number, savingsGoal: number): boolean {
  return totalSalary > 0 || savingsGoal > 0;
}

export default function IncomeSettings({
  monthKey,
  monthLabel,
  totalSalary,
  savingsGoal,
  carriedFromMonthLabel,
  isOpen: controlledOpen,
  onOpenChange,
  showTrigger = true,
}: IncomeSettingsProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isOpen = controlledOpen ?? internalOpen;

  const setOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalOpen(open);
    }
  };

  const [salary, setSalary] = useState(String(totalSalary || ""));
  const [goal, setGoal] = useState(String(savingsGoal || ""));
  const [prefillLabel, setPrefillLabel] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carryForwardLabel = carriedFromMonthLabel ?? prefillLabel;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    const syncForm = async () => {
      setError(null);
      setPrefillLabel(null);

      if (hasIncomeValues(totalSalary, savingsGoal)) {
        setSalary(String(totalSalary));
        setGoal(String(savingsGoal));
        return;
      }

      const prior = await getPriorMonthBudgetAction(monthKey);

      if (cancelled) {
        return;
      }

      if (prior && hasIncomeValues(prior.totalSalary, prior.savingsGoal)) {
        setSalary(String(prior.totalSalary));
        setGoal(String(prior.savingsGoal));
        setPrefillLabel(formatMonthLabel(prior.monthKey));
        return;
      }

      setSalary("");
      setGoal("");
    };

    void syncForm();

    return () => {
      cancelled = true;
    };
  }, [totalSalary, savingsGoal, isOpen, monthKey]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const parsedSalary = Number.parseFloat(salary);
    const parsedGoal = Number.parseFloat(goal);

    if (!Number.isFinite(parsedSalary) || parsedSalary <= 0) {
      setError("Enter a valid monthly salary.");
      setIsSubmitting(false);
      return;
    }

    if (!Number.isFinite(parsedGoal) || parsedGoal < 0) {
      setError("Enter a valid savings goal.");
      setIsSubmitting(false);
      return;
    }

    if (parsedGoal >= parsedSalary) {
      setError("Savings goal must be less than salary.");
      setIsSubmitting(false);
      return;
    }

    const result = await saveIncomeAction({
      monthKey,
      totalSalary: parsedSalary,
      savingsGoal: parsedGoal,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Could not save income. Try again.");
      return;
    }

    setOpen(false);
    router.refresh();
  };

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close income settings"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="income-settings-title"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="fixed left-1/2 top-1/2 z-[201] w-[min(calc(100vw-2rem),28rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-cardBorder bg-card shadow-[0_0_60px_rgba(139,92,246,0.2)]"
          >
            <div className="border-b border-cardBorder px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.25em] text-neonViolet/80">
                    Monthly Income
                  </p>
                  <h2
                    id="income-settings-title"
                    className="mt-2 text-lg font-semibold text-zinc-100"
                  >
                    {monthLabel}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Salary and savings goal only — category limits are separate.
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-cardBorder bg-background text-zinc-400 transition-colors hover:border-neonViolet/40 hover:text-zinc-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 px-6 py-5">
              {carryForwardLabel && (
                <p className="rounded-xl border border-neonViolet/25 bg-neonViolet/10 px-4 py-3 text-sm text-zinc-300">
                  Carried forward from{" "}
                  <span className="font-medium text-neonViolet">
                    {carryForwardLabel}
                  </span>
                  . Review and save, or edit as needed.
                </p>
              )}

              <label className="block">
                <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                  Monthly Salary
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={salary}
                  onChange={(event) => setSalary(event.target.value)}
                  placeholder="150000"
                  className="w-full rounded-xl border border-cardBorder bg-background px-4 py-3 text-zinc-100 outline-none transition-colors focus:border-neonViolet"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                  Savings Goal
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={goal}
                  onChange={(event) => setGoal(event.target.value)}
                  placeholder="30000"
                  className="w-full rounded-xl border border-cardBorder bg-background px-4 py-3 text-zinc-100 outline-none transition-colors focus:border-neonViolet"
                />
              </label>

              {salary && goal && (
                <p className="text-sm text-zinc-500">
                  Spendable this month:{" "}
                  <span className="font-medium text-neonEmerald">
                    {formatCurrency(
                      Math.max(
                        Number.parseFloat(salary) - Number.parseFloat(goal),
                        0,
                      ),
                    )}
                  </span>
                </p>
              )}

              {error && <p className="text-sm text-neonCrimson">{error}</p>}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl border border-neonViolet/40 bg-neonViolet/15 py-3 text-sm font-semibold text-neonViolet transition-colors hover:bg-neonViolet/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Saving..." : "Save Income"}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {showTrigger && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-cardBorder bg-card px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-neonViolet/40 hover:text-zinc-100"
        >
          <Wallet className="h-4 w-4 text-neonViolet" />
          Income
        </button>
      )}

      {mounted && createPortal(modal, document.body)}
    </>
  );
}
