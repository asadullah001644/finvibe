"use client";

import React, { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Repeat, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  deleteRecurringExpenseAction,
  getRecurringExpensesAction,
  saveRecurringExpenseAction,
} from "@/lib/actions";
import { getCategoryGroups, resolveCategoryHint } from "@/lib/constants";
import { formatCurrency } from "@/lib/currency";
import type { RecurringExpense } from "@/lib/types";

interface RecurringExpensesSettingsProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

const emptyForm = {
  amount: "",
  category: "",
  description: "",
};

export default function RecurringExpensesSettings({
  isOpen: controlledOpen,
  onOpenChange,
  showTrigger = true,
}: RecurringExpensesSettingsProps) {
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

  const [items, setItems] = useState<RecurringExpense[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categoryGroups = getCategoryGroups();

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    const data = await getRecurringExpensesAction();
    setItems(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setForm(emptyForm);
    setEditingId(null);
    setError(null);
    void loadItems();
  }, [isOpen, loadItems]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const startEdit = (item: RecurringExpense) => {
    setEditingId(item.id);
    setForm({
      amount: String(item.amount),
      category: item.category,
      description: item.description,
    });
    setError(null);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const parsedAmount = Number.parseFloat(form.amount);

    const result = await saveRecurringExpenseAction({
      id: editingId ?? undefined,
      amount: parsedAmount,
      category: form.category,
      description: form.description,
      isActive: editingId
        ? (items.find((item) => item.id === editingId)?.isActive ?? true)
        : true,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Could not save recurring expense.");
      return;
    }

    resetForm();
    await loadItems();
    router.refresh();
  };

  const handleToggleActive = async (item: RecurringExpense) => {
    setError(null);

    const result = await saveRecurringExpenseAction({
      id: item.id,
      amount: item.amount,
      category: item.category,
      description: item.description,
      isActive: !item.isActive,
    });

    if (!result.success) {
      setError(result.error ?? "Could not update recurring expense.");
      return;
    }

    await loadItems();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    setError(null);

    const result = await deleteRecurringExpenseAction(id);

    if (!result.success) {
      setError(result.error ?? "Could not delete recurring expense.");
      return;
    }

    if (editingId === id) {
      resetForm();
    }

    await loadItems();
    router.refresh();
  };

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Close recurring expenses"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="recurring-expenses-title"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            className="fixed left-1/2 top-1/2 z-[201] flex max-h-[min(90vh,720px)] w-[min(calc(100vw-2rem),32rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-cardBorder bg-card shadow-[0_0_60px_rgba(139,92,246,0.2)]"
          >
            <div className="shrink-0 border-b border-cardBorder px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.25em] text-neonViolet/80">
                    Monthly Templates
                  </p>
                  <h2
                    id="recurring-expenses-title"
                    className="mt-2 text-lg font-semibold text-zinc-100"
                  >
                    Recurring Expenses
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Active items auto-seed on the 1st of each new month.
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

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 py-5">
              <form onSubmit={handleSubmit} className="space-y-4 border-b border-cardBorder pb-5">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                  {editingId ? "Edit template" : "Add template"}
                </p>

                <label className="block">
                  <span className="mb-2 block text-xs text-zinc-500">Label</span>
                  <input
                    type="text"
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="SIM package, rent, Netflix..."
                    className="w-full rounded-xl border border-cardBorder bg-background px-4 py-3 text-zinc-100 outline-none transition-colors focus:border-neonViolet"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-2 block text-xs text-zinc-500">Amount</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.amount}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          amount: event.target.value,
                        }))
                      }
                      placeholder="25000"
                      className="w-full rounded-xl border border-cardBorder bg-background px-4 py-3 text-zinc-100 outline-none transition-colors focus:border-neonViolet"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs text-zinc-500">Category</span>
                    <select
                      value={form.category}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          category: event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-cardBorder bg-background px-3 py-3 text-sm text-zinc-100 outline-none transition-colors focus:border-neonViolet"
                    >
                      <option value="">Select...</option>
                      {categoryGroups.map((group) => (
                        <optgroup key={group.label ?? "root"} label={group.label ?? "General"}>
                          {group.items.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </label>
                </div>

                {form.category && resolveCategoryHint(form.category) && (
                  <p className="text-xs text-zinc-500">
                    {resolveCategoryHint(form.category)}
                  </p>
                )}

                <div className="flex gap-2">
                  {editingId && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-xl border border-cardBorder px-4 py-3 text-sm text-zinc-400 transition-colors hover:text-zinc-200"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-neonViolet/40 bg-neonViolet/15 py-3 text-sm font-semibold text-neonViolet transition-colors hover:bg-neonViolet/25 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" />
                    {isSubmitting
                      ? "Saving..."
                      : editingId
                        ? "Update Template"
                        : "Add Template"}
                  </button>
                </div>
              </form>

              <div className="mt-5 space-y-3">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                  Your templates
                </p>

                {isLoading ? (
                  <p className="text-sm text-zinc-500">Loading...</p>
                ) : items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-cardBorder px-4 py-6 text-center text-sm text-zinc-500">
                    No recurring expenses yet. Add your SIM package, rent,
                    subscriptions, or other fixed costs above.
                  </p>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-xl border px-4 py-3 ${
                        item.isActive
                          ? "border-cardBorder bg-background/60"
                          : "border-cardBorder/60 bg-background/30 opacity-70"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="font-medium text-zinc-100">
                            {item.description || item.category}
                          </p>
                          <p className="mt-1 text-sm text-zinc-500">
                            {formatCurrency(item.amount)} · {item.category}
                          </p>
                        </button>

                        <div className="flex shrink-0 items-center gap-2">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={item.isActive}
                            aria-label={
                              item.isActive
                                ? "Deactivate recurring expense"
                                : "Activate recurring expense"
                            }
                            onClick={() => void handleToggleActive(item)}
                            className={`relative h-6 w-11 rounded-full transition-colors ${
                              item.isActive ? "bg-neonEmerald/80" : "bg-zinc-700"
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                                item.isActive ? "left-[22px]" : "left-0.5"
                              }`}
                            />
                          </button>
                          <button
                            type="button"
                            aria-label="Delete recurring expense"
                            onClick={() => void handleDelete(item.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-cardBorder text-zinc-500 transition-colors hover:border-neonCrimson/40 hover:text-neonCrimson"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {error && <p className="mt-4 text-sm text-neonCrimson">{error}</p>}
            </div>
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
          <Repeat className="h-4 w-4 text-neonViolet" />
          Recurring
        </button>
      )}

      {mounted && createPortal(modal, document.body)}
    </>
  );
}
