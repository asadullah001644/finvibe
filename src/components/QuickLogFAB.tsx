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
import { ChevronDown, Loader2, Plus } from "lucide-react";
import {
  ModalBackdrop,
  ModalCloseButton,
  ModalDragHandle,
  getModalMotionProps,
  useIsDesktop,
} from "@/components/ui/modal";
import { useAppNavigation } from "@/components/NavigationLoadingProvider";
import { saveExpenseAction } from "@/lib/actions";
import {
  getCategoryGroups,
  getChildCategoryName,
  resolveCategoryHint,
} from "@/lib/constants";
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

type CategoryGroup = ReturnType<typeof getCategoryGroups>[number];

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

function categoryChipClass(isSelected: boolean): string {
  return [
    "min-h-11 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-150",
    isSelected
      ? "border-neonViolet/70 bg-neonViolet/15 text-neonViolet shadow-[inset_0_0_0_1px_rgba(139,92,246,0.25),0_0_16px_rgba(139,92,246,0.1)]"
      : "border-cardBorder/80 bg-background/50 text-zinc-300 hover:border-neonViolet/35 hover:bg-card/80",
  ].join(" ");
}

function formatSelectedCategoryLabel(category: string): string {
  const parts = category.split(" › ");
  if (parts.length <= 1) {
    return category;
  }

  return `${parts[0]} · ${parts.slice(1).join(" · ")}`;
}

function CategoryGroupDropdown({
  label,
  items,
  selectedCategory,
  onSelect,
  isOpen,
  onToggle,
}: {
  label: string;
  items: string[];
  selectedCategory: string;
  onSelect: (category: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const hasSelection = items.includes(selectedCategory);

  return (
    <div
      className={`overflow-hidden rounded-xl border transition-colors ${
        hasSelection
          ? "border-neonViolet/40 bg-neonViolet/[0.06]"
          : "border-cardBorder/80 bg-background/40"
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-3 px-3.5 py-3 text-left transition-colors hover:bg-white/[0.02]"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 ${
              isOpen ? "rotate-0" : "-rotate-90"
            }`}
          />
          <span
            className={`text-sm font-semibold ${
              hasSelection ? "text-neonViolet" : "text-zinc-200"
            }`}
          >
            {label}
          </span>
        </span>
        {hasSelection && (
          <span className="truncate rounded-full border border-neonViolet/25 bg-neonViolet/10 px-2.5 py-0.5 text-xs font-medium text-neonViolet">
            {getChildCategoryName(selectedCategory)}
          </span>
        )}
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-cardBorder/60 px-3 pb-3 pt-2.5">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {items.map((item) => {
                  const isSelected = selectedCategory === item;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => onSelect(item)}
                      className={`${categoryChipClass(isSelected)} text-center text-xs sm:text-sm`}
                    >
                      {getChildCategoryName(item)}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CategoryPicker({
  groups,
  selectedCategory,
  onSelect,
}: {
  groups: CategoryGroup[];
  selectedCategory: string;
  onSelect: (category: string) => void;
}) {
  const parentGroups = groups.filter((group) => group.label);
  const standaloneItems = groups
    .filter((group) => !group.label)
    .flatMap((group) => group.items);

  const selectedParent =
    parentGroups.find((group) => group.items.includes(selectedCategory))?.label ??
    null;

  const [openParent, setOpenParent] = useState<string | null>(selectedParent);

  useEffect(() => {
    if (selectedParent) {
      setOpenParent(selectedParent);
    }
  }, [selectedParent]);

  const handleToggleParent = (label: string) => {
    setOpenParent((current) => (current === label ? null : label));
  };

  return (
    <div className="space-y-4">
      {parentGroups.length > 0 && (
        <div className="space-y-2">
          {parentGroups.map((group) => (
            <CategoryGroupDropdown
              key={group.label}
              label={group.label!}
              items={group.items}
              selectedCategory={selectedCategory}
              onSelect={onSelect}
              isOpen={openParent === group.label}
              onToggle={() => handleToggleParent(group.label!)}
            />
          ))}
        </div>
      )}

      {standaloneItems.length > 0 && (
        <div>
          {parentGroups.length > 0 && (
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-600">
              General
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {standaloneItems.map((item) => {
              const isSelected = selectedCategory === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => onSelect(item)}
                  className={`${categoryChipClass(isSelected)} text-center text-xs sm:text-sm`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
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
                        className={`no-number-spinner ${fieldInputClass} font-semibold tabular-nums`}
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
                    <CategoryPicker
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

              <div className="sticky bottom-0 mt-5 shrink-0 bg-card/95 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm lg:bg-transparent lg:pb-0">
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
    <QuickLogContext.Provider value={{ open: () => setIsOpen(true) }}>
      {children}
      <QuickLogDesktopButton />
      {mounted && createPortal(modal, document.body)}
    </QuickLogContext.Provider>
  );
}
