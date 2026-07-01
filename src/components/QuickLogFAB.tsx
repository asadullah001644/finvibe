"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Banknote, FileText, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
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
      aria-label="Quick log expense"
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

export default function QuickLogFAB({
  customCategories,
  children,
}: QuickLogFABProps) {
  const categoryGroups = getCategoryGroups().map((group) => ({
    ...group,
    items: group.items.filter((item) => customCategories.includes(item)),
  })).filter((group) => group.items.length > 0);
  const router = useRouter();
  const amountRef = useRef<HTMLInputElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(getLocalTodayDateString);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      amountRef.current?.focus();
    }, 120);

    return () => window.clearTimeout(timer);
  }, [isOpen]);

  const resetForm = () => {
    setAmount("");
    setCategory("");
    setDescription("");
    setDate(getLocalTodayDateString());
    setError(null);
  };

  const closeSheet = () => {
    setIsOpen(false);
    resetForm();
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
      router.refresh();
    } catch {
      setError("Something went wrong while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <QuickLogContext.Provider value={{ open: () => setIsOpen(true) }}>
      {children}

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close quick log sheet"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSheet}
              className="fixed inset-0 z-50 bg-background/70 backdrop-blur-md"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="quick-log-title"
              initial={{ opacity: 0, scale: 0.94, y: 48 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 48 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-background/95 px-5 pb-8 pt-6"
            >
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.3em] text-neonEmerald/80">
                    Quick Log
                  </p>
                  <h2
                    id="quick-log-title"
                    className="mt-2 text-xl font-semibold text-zinc-100"
                  >
                    New Expense
                  </h2>
                </div>

                <button
                  type="button"
                  aria-label="Close"
                  onClick={closeSheet}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-cardBorder bg-card text-zinc-400 transition-colors hover:border-neonViolet/40 hover:text-zinc-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-6">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                    <Banknote className="h-4 w-4 text-neonEmerald" />
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
                    className="w-full rounded-2xl border border-cardBorder bg-card px-4 py-4 text-2xl font-semibold text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-neonViolet focus:shadow-[0_0_0_1px_rgba(139,92,246,0.45)]"
                  />
                </label>

                <div>
                  <p className="mb-3 text-sm font-medium text-zinc-300">Category</p>
                  <div className="max-h-56 overflow-y-auto rounded-2xl border border-cardBorder/60 p-2">
                    <div className="space-y-3">
                      {categoryGroups.map((group) => (
                        <div key={group.label ?? group.items[0]}>
                          {group.label && (
                            <p className="sticky top-0 z-10 mb-2 bg-background/95 px-1 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-neonViolet/80">
                              {group.label}
                            </p>
                          )}
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                                  className={`min-h-14 rounded-xl border px-2 py-3 text-xs font-medium transition-colors sm:text-sm ${
                                    isSelected
                                      ? "border-neonViolet bg-card text-neonViolet shadow-[0_0_20px_rgba(139,92,246,0.18)]"
                                      : "border-cardBorder bg-card text-zinc-200 hover:border-neonViolet"
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

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                    <FileText className="h-4 w-4 text-neonViolet" />
                    Description
                    <span className="text-xs font-normal text-zinc-500">(optional)</span>
                  </span>
                  <input
                    type="text"
                    placeholder="Coffee, groceries, subscription..."
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className="w-full rounded-2xl border border-cardBorder bg-card px-4 py-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-neonViolet"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                    <Calendar className="h-4 w-4 text-neonViolet" />
                    Date
                  </span>
                  <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="w-full rounded-2xl border border-cardBorder bg-card px-4 py-3 text-sm text-zinc-100 outline-none transition-colors focus:border-neonViolet [color-scheme:dark]"
                  />
                </label>

                {error && (
                  <p className="rounded-xl border border-neonCrimson/30 bg-neonCrimson/10 px-4 py-3 text-sm text-neonCrimson">
                    {error}
                  </p>
                )}

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileTap={isSubmitting ? undefined : { scale: 0.98 }}
                  className="mt-auto rounded-2xl border border-neonEmerald/40 bg-neonEmerald/15 px-4 py-4 text-sm font-semibold text-neonEmerald transition-colors hover:bg-neonEmerald/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : "Save Expense"}
                </motion.button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </QuickLogContext.Provider>
  );
}
