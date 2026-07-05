"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Banknote, FileText, Loader2, Plus, X } from "lucide-react";
import { useAppNavigation } from "@/components/NavigationLoadingProvider";
import { saveExpenseAction } from "@/lib/actions";
import { getCategoryGroups, resolveCategoryHint } from "@/lib/constants";
import { getLocalTodayDateString } from "@/lib/expenseDate";

interface QuickLogContextValue {
  open: () => void;
}

const QuickLogContext = createContext<QuickLogContextValue | null>(null);

export function useQuickLog(): QuickLogContextValue {
  const context = useContext(QuickLogContext);
  if (!context) {
    throw new Error("useQuickLog must be used within QuickLogFAB");
  }
  return context;
}

interface QuickLogFABProps {
  customCategories: string[];
  children?: ReactNode;
}

export function QuickLogNavButton() {
  const { open } = useQuickLog();

  return (
    <motion.button
      type="button"
      aria-label="Add expense"
      whileTap={{ scale: 0.92 }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      onClick={open}
      className="relative -mt-6 flex h-14 w-14 items-center justify-center"
    >
      <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-neonEmerald/35" />
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-neonEmerald bg-card text-neonEmerald shadow-[0_0_28px_rgba(16,185,129,0.45)]">
        <Plus className="h-6 w-6" strokeWidth={2.25} />
      </span>
    </motion.button>
  );
}

export function QuickLogDesktopButton() {
  const { open } = useQuickLog();

  return (
    <motion.button
      type="button"
      aria-label="Add expense"
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      onClick={open}
      className="fixed bottom-8 right-8 z-40 hidden h-14 items-center gap-2 rounded-full border border-neonEmerald/40 bg-card px-5 text-sm font-semibold text-neonEmerald shadow-[0_0_28px_rgba(16,185,129,0.25)] lg:inline-flex"
    >
      <Plus className="h-5 w-5" strokeWidth={2.25} />
      Add Expense
    </motion.button>
  );
}

export default function QuickLogFAB({
  customCategories,
  children,
}: QuickLogFABProps) {
  const categoryGroups = getCategoryGroups()
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => customCategories.includes(item)),
    }))
    .filter((group) => group.items.length > 0);
  const { refresh } = useAppNavigation();
  const amountRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(getLocalTodayDateString);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const updateLayout = () => {
      setIsDesktop(mediaQuery.matches);
    };

    updateLayout();
    mediaQuery.addEventListener("change", updateLayout);
    return () => mediaQuery.removeEventListener("change", updateLayout);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      amountRef.current?.focus();
    }, 120);

    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const resetForm = useCallback(() => {
    setAmount("");
    setCategory("");
    setDescription("");
    setDate(getLocalTodayDateString());
    setError(null);
  }, []);

  const closeSheet = useCallback(() => {
    setIsOpen(false);
    resetForm();
  }, [resetForm]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        closeSheet();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeSheet, isOpen, isSubmitting]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const parsedAmount = Number.parseFloat(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount greater than zero.");
      return;
    }

    if (!category) {
      setError("Select a category to continue.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await saveExpenseAction({
        amount: parsedAmount,
        category,
        description: description.trim(),
        date,
      });

      if (!result.success) {
        setError(result.error ?? "Unable to save expense. Please try again.");
        return;
      }

      resetForm();
      setIsOpen(false);
      await refresh();
    } catch {
      setError("Something went wrong while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close add expense dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSheet}
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-expense-title"
            initial={
              isDesktop
                ? { opacity: 0, scale: 0.96, y: 12 }
                : { opacity: 0, y: "100%" }
            }
            animate={
              isDesktop
                ? { opacity: 1, scale: 1, y: 0 }
                : { opacity: 1, y: 0 }
            }
            exit={
              isDesktop
                ? { opacity: 0, scale: 0.96, y: 12 }
                : { opacity: 0, y: "100%" }
            }
            transition={{ type: "spring", damping: 30, stiffness: 340 }}
            className="fixed z-[201] flex max-h-[min(90vh,720px)] flex-col overflow-hidden border border-cardBorder bg-card shadow-[0_0_60px_rgba(16,185,129,0.12)] inset-x-0 bottom-0 rounded-t-3xl lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:w-[min(calc(100vw-2rem),28rem)] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:shadow-[0_0_60px_rgba(139,92,246,0.18)]"
          >
            <div className="shrink-0 border-b border-cardBorder px-5 pb-4 pt-4 lg:px-6 lg:pb-5 lg:pt-5">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-cardBorder lg:hidden" />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.28em] text-neonEmerald/80">
                    Add Expense
                  </p>
                  <h2
                    id="add-expense-title"
                    className="mt-2 text-lg font-semibold text-zinc-100"
                  >
                    Log a purchase
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Amount, category, and date — saved to this month.
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Close"
                  onClick={closeSheet}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cardBorder bg-background text-zinc-400 transition-colors hover:border-neonViolet/40 hover:text-zinc-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5 lg:px-6"
            >
              <div className="space-y-5">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                    <Banknote className="h-3.5 w-3.5 text-neonEmerald" />
                    Amount (PKR)
                  </span>
                  <input
                    ref={amountRef}
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="w-full rounded-xl border border-cardBorder bg-background px-4 py-3 text-2xl font-semibold tabular-nums text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-neonViolet focus:shadow-[0_0_0_1px_rgba(139,92,246,0.45)]"
                  />
                </label>

                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                    Category
                  </p>
                  <div className="max-h-44 overflow-y-auto rounded-xl border border-cardBorder/80 bg-background/40 p-2.5 sm:max-h-52">
                    <div className="space-y-3">
                      {categoryGroups.map((group) => (
                        <div key={group.label ?? group.items[0]}>
                          {group.label && (
                            <p className="sticky top-0 z-10 mb-2 bg-background/95 px-1 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-neonViolet/80">
                              {group.label}
                            </p>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            {group.items.map((item) => {
                              const isSelected = category === item;
                              const displayName = group.label
                                ? item.split(" › ").slice(1).join(" › ")
                                : item;

                              return (
                                <button
                                  key={item}
                                  type="button"
                                  onClick={() => setCategory(item)}
                                  className={`min-h-11 rounded-lg border px-2.5 py-2.5 text-left text-xs font-medium transition-colors sm:text-sm ${
                                    isSelected
                                      ? "border-neonViolet bg-neonViolet/10 text-neonViolet shadow-[0_0_16px_rgba(139,92,246,0.15)]"
                                      : "border-cardBorder bg-card text-zinc-200 hover:border-neonViolet/50"
                                  }`}
                                >
                                  {displayName}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {category && resolveCategoryHint(category) && (
                    <p className="mt-2 text-xs text-zinc-500">
                      {resolveCategoryHint(category)}
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                      <FileText className="h-3.5 w-3.5 text-neonViolet" />
                      Description
                      <span className="normal-case tracking-normal text-zinc-600">
                        (optional)
                      </span>
                    </span>
                    <input
                      type="text"
                      placeholder="Coffee, groceries..."
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      className="w-full rounded-xl border border-cardBorder bg-background px-4 py-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-neonViolet"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                      <Calendar className="h-3.5 w-3.5 text-neonViolet" />
                      Date
                    </span>
                    <input
                      type="date"
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                      className="w-full rounded-xl border border-cardBorder bg-background px-4 py-3 text-sm text-zinc-100 outline-none transition-colors focus:border-neonViolet [color-scheme:dark]"
                    />
                  </label>
                </div>

                {error && (
                  <p className="rounded-xl border border-neonCrimson/30 bg-neonCrimson/10 px-4 py-3 text-sm text-neonCrimson">
                    {error}
                  </p>
                )}
              </div>

              <div className="sticky bottom-0 mt-5 shrink-0 border-t border-cardBorder/80 bg-card pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:static lg:border-0 lg:bg-transparent lg:pb-0 lg:pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-neonEmerald/40 bg-neonEmerald/15 px-4 py-3.5 text-sm font-semibold text-neonEmerald transition-colors hover:bg-neonEmerald/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Expense"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <QuickLogContext.Provider value={{ open: () => setIsOpen(true) }}>
      {children}
      <QuickLogDesktopButton />
      {mounted && createPortal(modal, document.body)}
    </QuickLogContext.Provider>
  );
}
