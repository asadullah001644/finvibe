"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutList, Sparkles, X } from "lucide-react";
import { useAppNavigation } from "@/components/NavigationLoadingProvider";
import { saveCategoryAllocationsAction } from "@/lib/actions";
import {
  distributeCategoryBudgets,
  getCategoryGroups,
  getChildCategoryName,
  resolveCategoryHint,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/currency";
import type { BudgetCategory } from "@/lib/types";

interface CategoryAllocationProps {
  monthKey: string;
  monthLabel: string;
  totalSalary: number;
  savingsGoal: number;
  categories: BudgetCategory[];
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
  hasLimitsSet?: boolean;
}

export default function CategoryAllocation({
  monthKey,
  monthLabel,
  totalSalary,
  savingsGoal,
  categories,
  isOpen: controlledOpen,
  onOpenChange,
  showTrigger = true,
  hasLimitsSet = false,
}: CategoryAllocationProps) {
  const { refresh } = useAppNavigation();
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

  const [categoryRows, setCategoryRows] = useState<BudgetCategory[]>(categories);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const spendable = Math.max(totalSalary - savingsGoal, 0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setCategoryRows(categories);
    setError(null);
  }, [categories, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleCategoryChange = (name: string, allocated: string) => {
    setCategoryRows((rows) =>
      rows.map((row) =>
        row.name === name
          ? { ...row, allocated: Number.parseFloat(allocated) || 0 }
          : row,
      ),
    );
  };

  const categoryGroups = getCategoryGroups();

  const handleSuggestSplit = () => {
    if (spendable <= 0) {
      setError("Set your income and savings goal first.");
      return;
    }

    setError(null);
    setCategoryRows(distributeCategoryBudgets(categories, spendable));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await saveCategoryAllocationsAction({
      monthKey,
      categories: categoryRows,
    });

    if (!result.success) {
      setError(result.error ?? "Could not save category limits. Try again.");
      setIsSubmitting(false);
      return;
    }

    setOpen(false);
    await refresh();
    setIsSubmitting(false);
  };

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close category allocation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-allocation-title"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="fixed left-1/2 top-1/2 z-[201] flex max-h-[min(90vh,720px)] w-[min(calc(100vw-2rem),32rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-cardBorder bg-card shadow-[0_0_60px_rgba(139,92,246,0.2)]"
          >
            <div className="shrink-0 border-b border-cardBorder px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.25em] text-neonEmerald/80">
                    Category Limits
                  </p>
                  <h2
                    id="category-allocation-title"
                    className="mt-2 text-lg font-semibold text-zinc-100"
                  >
                    {monthLabel}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Optional caps per category — set only what you care about.
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

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                {spendable > 0 ? (
                  <p className="text-sm text-zinc-500">
                    Spendable:{" "}
                    <span className="font-medium text-neonEmerald">
                      {formatCurrency(spendable)}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-zinc-500">
                    Set income first to use suggest split.
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleSuggestSplit}
                  disabled={spendable <= 0}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neonViolet/30 bg-neonViolet/10 px-3 py-1.5 text-xs font-medium text-neonViolet transition-colors hover:bg-neonViolet/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Suggest split
                </button>
              </div>

              <div className="space-y-4">
                {categoryGroups.map((group) => {
                  const groupRows = group.items
                    .map((name) =>
                      categoryRows.find((category) => category.name === name),
                    )
                    .filter(
                      (category): category is BudgetCategory =>
                        category !== undefined,
                    );

                  if (groupRows.length === 0) {
                    return null;
                  }

                  return (
                    <div key={group.label ?? group.items[0]} className="space-y-2">
                      {group.label && (
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-neonViolet/80">
                          {group.label}
                        </p>
                      )}
                      {groupRows.map((category) => (
                        <div
                          key={category.name}
                          className={`flex items-center gap-3 rounded-xl border border-cardBorder bg-background/60 px-3 py-2 ${
                            group.label ? "ml-3" : ""
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="block text-sm text-zinc-300">
                              {group.label
                                ? getChildCategoryName(category.name)
                                : category.name}
                            </span>
                            {resolveCategoryHint(category.name) && (
                              <span className="mt-0.5 block text-[11px] text-zinc-500">
                                {resolveCategoryHint(category.name)}
                              </span>
                            )}
                          </div>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={category.allocated || ""}
                            onChange={(event) =>
                              handleCategoryChange(
                                category.name,
                                event.target.value,
                              )
                            }
                            placeholder="0"
                            className="w-28 rounded-lg border border-cardBorder bg-card px-3 py-2 text-right text-sm text-zinc-100 outline-none focus:border-neonViolet"
                          />
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              {error && <p className="mt-4 text-sm text-neonCrimson">{error}</p>}

              <div className="mt-6 shrink-0 border-t border-cardBorder pt-5">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-neonEmerald/40 bg-neonEmerald/10 py-3 text-sm font-semibold text-neonEmerald transition-colors hover:bg-neonEmerald/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Saving..." : "Save Category Limits"}
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
      {showTrigger && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative inline-flex items-center gap-2 rounded-xl border border-cardBorder bg-card px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-neonEmerald/40 hover:text-zinc-100"
        >
          <LayoutList className="h-4 w-4 text-neonEmerald" />
          Categories
          {!hasLimitsSet && (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-neonViolet shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
          )}
        </button>
      )}

      {mounted && createPortal(modal, document.body)}
    </>
  );
}
