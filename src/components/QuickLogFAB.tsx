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
import { CategoryPickerPanel } from "@/components/CategoryPickerUI";
import { useAppNavigation } from "@/components/NavigationLoadingProvider";
import { saveExpenseAction } from "@/lib/actions";
import {
  buildCategoryGroupsFromNames,
  resolveCategoryHint,
} from "@/lib/constants";
import { getLocalTodayDateString } from "@/lib/expenseDate";

interface QuickLogContextValue {
  open: () => void;
  isOpening: boolean;
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

function formatSelectedCategoryLabel(category: string): string {
  const parts = category.split(" › ");
  if (parts.length <= 1) {
    return category;
  }

  return `${parts[0]} · ${parts.slice(1).join(" · ")}`;
}

const fieldLabelClass =
  "mb-2 block text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500";

const fieldLabelInlineClass =
  "text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500";

const fieldShellClass =
  "flex h-11 w-full items-center rounded-xl border border-cardBorder/70 bg-[#0C0C0F]/60 px-3.5 ring-1 ring-white/[0.02] transition-colors focus-within:border-neonViolet/50 focus-within:ring-neonViolet/20";

const fieldInputClass =
  "w-full min-w-0 border-0 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600";

const standaloneFieldClass =
  "h-11 w-full rounded-xl border border-cardBorder/70 bg-[#0C0C0F]/60 px-3.5 text-sm text-zinc-100 outline-none ring-1 ring-white/[0.02] transition-colors placeholder:text-zinc-600 focus:border-neonViolet/50 focus:ring-neonViolet/20";

export function QuickLogNavButton() {
  const { open, isOpening } = useQuickLog();

  return (
    <motion.button
      type="button"
      aria-label="Add expense"
      aria-busy={isOpening}
      disabled={isOpening}
      whileTap={isOpening ? undefined : { scale: 0.92 }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      onClick={open}
      className="relative -mt-6 flex h-14 w-14 items-center justify-center disabled:opacity-80"
    >
      {!isOpening && (
        <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-neonEmerald/35" />
      )}
      <span className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-neonEmerald bg-card text-neonEmerald shadow-[0_0_28px_rgba(16,185,129,0.45)]">
        {isOpening ? (
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
        ) : (
          <Plus className="h-6 w-6" strokeWidth={2.25} />
        )}
      </span>
    </motion.button>
  );
}

export function QuickLogDesktopButton() {
  const { open, isOpening } = useQuickLog();

  return (
    <motion.button
      type="button"
      aria-label="Add expense"
      aria-busy={isOpening}
      disabled={isOpening}
      whileTap={isOpening ? undefined : { scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      onClick={open}
      className="fixed bottom-8 right-8 z-40 hidden h-14 items-center gap-2 rounded-full border border-neonEmerald/40 bg-card px-5 text-sm font-semibold text-neonEmerald shadow-[0_0_28px_rgba(16,185,129,0.25)] disabled:opacity-80 lg:inline-flex"
    >
      {isOpening ? (
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      ) : (
        <Plus className="h-5 w-5" strokeWidth={2.25} />
      )}
      Add Expense
    </motion.button>
  );
}

export default function QuickLogFAB({
  customCategories,
  children,
}: QuickLogFABProps) {
  const categoryGroups = buildCategoryGroupsFromNames(customCategories).filter(
    (group) => group.items.length > 0,
  );
  const { refresh } = useAppNavigation();
  const amountRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
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
    if (isOpen) {
      setIsOpening(false);
    }
  }, [isOpen]);

  const openSheet = useCallback(() => {
    setIsOpening(true);
    setIsOpen(true);
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
            <div className="relative shrink-0 border-b border-cardBorder/80 px-5 pb-3 pt-4 lg:px-7 lg:pb-4 lg:pt-5">
              <ModalDragHandle />

              <div className="flex items-center justify-between gap-4">
                <h2
                  id="add-expense-title"
                  className="text-lg font-semibold tracking-tight text-zinc-100 lg:text-xl"
                >
                  Add expense
                </h2>

                <ModalCloseButton onClick={closeSheet} accent="violet" />
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-4 lg:px-7 lg:py-5"
            >
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_9.5rem] sm:items-end">
                  <label className="block min-w-0">
                    <span className={fieldLabelClass}>Amount</span>
                    <div className={fieldShellClass}>
                      <span className="mr-2 shrink-0 text-sm font-medium text-zinc-500">
                        PKR
                      </span>
                      <input
                        ref={amountRef}
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="0"
                        value={amount}
                        onChange={handleAmountChange}
                        className={`${fieldInputClass} font-semibold tabular-nums`}
                      />
                    </div>
                  </label>

                  <label className="block min-w-0">
                    <span className={fieldLabelClass}>Date</span>
                    <div className={fieldShellClass}>
                      <input
                        type="date"
                        value={date}
                        onChange={(event) => setDate(event.target.value)}
                        className={`${fieldInputClass} [color-scheme:dark]`}
                      />
                    </div>
                  </label>
                </div>

                <label className="block">
                  <span className={fieldLabelClass}>
                    Note{" "}
                    <span className="font-normal normal-case tracking-normal text-zinc-600">
                      (optional)
                    </span>
                  </span>
                  <input
                    type="text"
                    placeholder="What was this for?"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className={standaloneFieldClass}
                  />
                </label>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className={fieldLabelInlineClass}>
                      Category
                    </p>
                    {category && (
                      <span className="truncate rounded-full border border-neonViolet/25 bg-neonViolet/10 px-2.5 py-0.5 text-xs font-medium text-neonViolet">
                        {formatSelectedCategoryLabel(category)}
                      </span>
                    )}
                  </div>
                  <div className="rounded-2xl border border-cardBorder/70 bg-[#0C0C0F]/60 p-3 ring-1 ring-white/[0.02] sm:p-3.5">
                    <CategoryPickerPanel
                      mode="single"
                      groups={categoryGroups}
                      selectedCategory={category}
                      onSelect={setCategory}
                    />
                  </div>
                  {category && resolveCategoryHint(category) && (
                    <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                      {resolveCategoryHint(category)}
                    </p>
                  )}
                </div>

                {error && (
                  <p className="rounded-xl border border-neonCrimson/30 bg-neonCrimson/10 px-4 py-3 text-sm text-neonCrimson">
                    {error}
                  </p>
                )}
              </div>

              <div className="sticky bottom-0 -mx-5 mt-5 shrink-0 border-t border-cardBorder/70 bg-card/95 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md lg:-mx-7 lg:px-7 lg:pb-5">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-neonEmerald px-4 py-3 text-sm font-semibold text-[#041510] shadow-[0_8px_24px_rgba(16,185,129,0.25)] transition-all hover:bg-[#0ea271] disabled:cursor-not-allowed disabled:opacity-50"
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
    <QuickLogContext.Provider value={{ open: openSheet, isOpening }}>
      {children}
      <QuickLogDesktopButton />
      {mounted && createPortal(modal, document.body)}
    </QuickLogContext.Provider>
  );
}
