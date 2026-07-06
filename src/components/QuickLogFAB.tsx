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
import { Loader2, Plus } from "lucide-react";
import {
  ModalBackdrop,
  ModalCloseButton,
  ModalDragHandle,
  getModalMotionProps,
  useIsDesktop,
} from "@/components/ui/modal";
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
  const isDesktop = useIsDesktop();
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

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
    }
  };

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
          <ModalBackdrop onClose={closeSheet} label="Close add expense dialog" />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-expense-title"
            {...getModalMotionProps(isDesktop)}
            className="fixed z-[201] flex max-h-[min(92vh,720px)] flex-col overflow-hidden border border-cardBorder bg-card shadow-[0_-16px_48px_rgba(0,0,0,0.45)] inset-x-0 bottom-0 rounded-t-[1.75rem] lg:inset-x-auto lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:max-h-[min(calc(100vh-3rem),680px)] lg:w-[min(calc(100vw-3rem),34rem)] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-2xl lg:border-cardBorder/80 lg:bg-[#111114] lg:shadow-[0_28px_80px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.04)]"
          >
            <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-36 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_72%)] lg:block" />

            <div className="relative shrink-0 border-b border-cardBorder/80 px-5 pb-4 pt-4 lg:px-7 lg:pb-5 lg:pt-6">
              <ModalDragHandle />

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-neonEmerald/75 lg:text-xs">
                    Add Expense
                  </p>
                  <h2
                    id="add-expense-title"
                    className="mt-2 text-xl font-semibold tracking-tight text-zinc-100 lg:mt-2.5 lg:text-2xl"
                  >
                    Record a transaction
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-zinc-500 lg:max-w-[22rem]">
                    Enter amount and category — it&apos;s added to this month&apos;s ledger.
                  </p>
                </div>

                <ModalCloseButton onClick={closeSheet} accent="violet" />
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-5 lg:px-7 lg:py-6"
            >
              <div className="space-y-6">
                <label className="block">
                  <span className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    Amount
                  </span>
                  <div className="overflow-hidden rounded-2xl border border-cardBorder/80 bg-background/70 ring-1 ring-white/[0.03] transition-colors focus-within:border-neonViolet/60 focus-within:ring-neonViolet/20 lg:bg-gradient-to-br lg:from-[#0C0C0F] lg:to-card/50">
                    <div className="flex items-center gap-3 px-4 py-1 lg:px-5 lg:py-2">
                      <span className="shrink-0 text-sm font-medium text-zinc-500">PKR</span>
                      <input
                        ref={amountRef}
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="0"
                        value={amount}
                        onChange={handleAmountChange}
                        className="no-number-spinner w-full min-w-0 border-0 bg-transparent py-3 text-3xl font-semibold tabular-nums tracking-tight text-zinc-100 outline-none placeholder:text-zinc-600 lg:py-3.5 lg:text-[2rem]"
                      />
                    </div>
                  </div>
                </label>

                <div>
                  <div className="mb-2.5 flex items-center justify-between gap-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                      Category
                    </p>
                    {category && (
                      <span className="truncate text-xs text-neonViolet/90">
                        {category.split(" › ").slice(-1)[0]}
                      </span>
                    )}
                  </div>
                  <div className="max-h-44 overflow-y-auto rounded-2xl border border-cardBorder/70 bg-[#0C0C0F]/80 p-3 ring-1 ring-white/[0.02] lg:max-h-56">
                    <div className="space-y-4">
                      {categoryGroups.map((group) => (
                        <div key={group.label ?? group.items[0]}>
                          {group.label && (
                            <p className="sticky top-0 z-10 mb-2.5 bg-[#0C0C0F]/95 px-0.5 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-neonViolet/75">
                              {group.label}
                            </p>
                          )}
                          <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
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
                                  className={`min-h-10 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-all duration-150 lg:text-[13px] ${
                                    isSelected
                                      ? "border-neonViolet/70 bg-neonViolet/15 text-neonViolet shadow-[inset_0_0_0_1px_rgba(139,92,246,0.25),0_0_20px_rgba(139,92,246,0.12)]"
                                      : "border-cardBorder/80 bg-card/50 text-zinc-300 hover:border-neonViolet/35 hover:bg-card"
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
                    <p className="mt-2.5 text-xs leading-relaxed text-zinc-500">
                      {resolveCategoryHint(category)}
                    </p>
                  )}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <label className="block lg:col-span-2">
                    <span className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                      Description{" "}
                      <span className="font-normal normal-case tracking-normal text-zinc-600">
                        (optional)
                      </span>
                    </span>
                    <input
                      type="text"
                      placeholder="What was this for?"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      className="w-full rounded-xl border border-cardBorder/80 bg-background/70 px-4 py-3 text-sm text-zinc-100 outline-none ring-1 ring-white/[0.03] transition-colors placeholder:text-zinc-600 focus:border-neonViolet/60 focus:ring-neonViolet/20"
                    />
                  </label>

                  <label className="block lg:col-span-2">
                    <span className="mb-2.5 block text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                      Date
                    </span>
                    <input
                      type="date"
                      value={date}
                      onChange={(event) => setDate(event.target.value)}
                      className="w-full rounded-xl border border-cardBorder/80 bg-background/70 px-4 py-3 text-sm text-zinc-100 outline-none ring-1 ring-white/[0.03] transition-colors focus:border-neonViolet/60 focus:ring-neonViolet/20 [color-scheme:dark] lg:max-w-[14rem]"
                    />
                  </label>
                </div>

                {error && (
                  <p className="rounded-xl border border-neonCrimson/30 bg-neonCrimson/10 px-4 py-3 text-sm text-neonCrimson">
                    {error}
                  </p>
                )}
              </div>

              <div className="sticky bottom-0 mt-6 shrink-0 border-t border-cardBorder/70 bg-card/95 pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:mt-7 lg:border-t lg:border-cardBorder/60 lg:bg-transparent lg:pb-0 lg:pt-5 lg:backdrop-blur-none">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neonEmerald px-4 py-3.5 text-sm font-semibold text-[#041510] shadow-[0_10px_28px_rgba(16,185,129,0.28)] transition-all hover:bg-[#0ea271] hover:shadow-[0_12px_32px_rgba(16,185,129,0.34)] disabled:cursor-not-allowed disabled:opacity-50 lg:py-3.5"
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
