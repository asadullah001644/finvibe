"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Settings, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { saveBudgetAction } from "@/lib/actions";
import type { BudgetCategory } from "@/lib/types";

interface BudgetSettingsProps {
  monthKey: string;
  monthLabel: string;
  totalSalary: number;
  savingsGoal: number;
  categories: BudgetCategory[];
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function distributeCategoryBudgets(
  categories: BudgetCategory[],
  spendable: number,
): BudgetCategory[] {
  if (spendable <= 0 || categories.length === 0) {
    return categories;
  }

  const weights: Record<string, number> = {
    Food: 0.25,
    Utilities: 0.15,
    Fuel: 0.1,
    Shopping: 0.2,
    Entertainment: 0.1,
    Other: 0.2,
  };

  return categories.map((category) => ({
    ...category,
    allocated: Math.round(spendable * (weights[category.name] ?? 0.15)),
  }));
}

export default function BudgetSettings({
  monthKey,
  monthLabel,
  totalSalary,
  savingsGoal,
  categories,
  isOpen: controlledOpen,
  onOpenChange,
}: BudgetSettingsProps) {
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
  const [categoryRows, setCategoryRows] = useState<BudgetCategory[]>(categories);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setSalary(String(totalSalary || ""));
    setGoal(String(savingsGoal || ""));
    setCategoryRows(categories);
    setError(null);
  }, [totalSalary, savingsGoal, categories, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSalaryOrGoalChange = (nextSalary: string, nextGoal: string) => {
    setSalary(nextSalary);
    setGoal(nextGoal);

    const parsedSalary = Number.parseFloat(nextSalary);
    const parsedGoal = Number.parseFloat(nextGoal);

    if (
      Number.isFinite(parsedSalary) &&
      Number.isFinite(parsedGoal) &&
      parsedSalary > parsedGoal &&
      categoryRows.every((row) => row.allocated === 0)
    ) {
      setCategoryRows(
        distributeCategoryBudgets(categories, parsedSalary - parsedGoal),
      );
    }
  };

  const handleCategoryChange = (index: number, allocated: string) => {
    setCategoryRows((rows) =>
      rows.map((row, rowIndex) =>
        rowIndex === index
          ? { ...row, allocated: Number.parseFloat(allocated) || 0 }
          : row,
      ),
    );
  };

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

    const result = await saveBudgetAction({
      monthKey,
      totalSalary: parsedSalary,
      savingsGoal: parsedGoal,
      categories: categoryRows,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setError("Could not save budget. Try again.");
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
            aria-label="Close budget settings"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="budget-settings-title"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="fixed left-1/2 top-1/2 z-[201] flex max-h-[min(90vh,720px)] w-[min(calc(100vw-2rem),32rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-cardBorder bg-card shadow-[0_0_60px_rgba(139,92,246,0.2)]"
          >
            <div className="shrink-0 border-b border-cardBorder px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.25em] text-neonViolet/80">
                    Monthly Budget
                  </p>
                  <h2
                    id="budget-settings-title"
                    className="mt-2 text-lg font-semibold text-zinc-100"
                  >
                    {monthLabel}
                  </h2>
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

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5"
            >
              <div className="space-y-5">
                <label className="block">
                  <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                    Monthly Salary
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={salary}
                    onChange={(event) =>
                      handleSalaryOrGoalChange(event.target.value, goal)
                    }
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
                    step="0.01"
                    value={goal}
                    onChange={(event) =>
                      handleSalaryOrGoalChange(salary, event.target.value)
                    }
                    placeholder="30000"
                    className="w-full rounded-xl border border-cardBorder bg-background px-4 py-3 text-zinc-100 outline-none transition-colors focus:border-neonViolet"
                  />
                </label>

                <div>
                  <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                    Category Limits
                  </p>
                  <div className="space-y-2">
                    {categoryRows.map((category, index) => (
                      <div
                        key={category.name}
                        className="flex items-center gap-3 rounded-xl border border-cardBorder bg-background/60 px-3 py-2"
                      >
                        <span className="min-w-0 flex-1 text-sm text-zinc-300">
                          {category.name}
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={category.allocated || ""}
                          onChange={(event) =>
                            handleCategoryChange(index, event.target.value)
                          }
                          placeholder="0"
                          className="w-28 rounded-lg border border-cardBorder bg-card px-3 py-2 text-right text-sm text-zinc-100 outline-none focus:border-neonViolet"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {salary && goal && (
                  <p className="text-sm text-zinc-500">
                    Spendable budget:{" "}
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
              </div>

              <div className="mt-6 shrink-0 border-t border-cardBorder pt-5">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-neonViolet/40 bg-neonViolet/15 py-3 text-sm font-semibold text-neonViolet transition-colors hover:bg-neonViolet/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Saving..." : "Save Budget"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-cardBorder bg-card px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-neonViolet/40 hover:text-zinc-100"
      >
        <Settings className="h-4 w-4 text-neonViolet" />
        Budget
      </button>

      {mounted && createPortal(modal, document.body)}
    </>
  );
}
