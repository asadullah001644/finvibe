"use client";

import React, { useMemo, useState } from "react";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  startOfMonth,
} from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Pencil, ShoppingBag, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  deleteExpenseAction,
  updateExpenseAction,
} from "@/lib/actions";
import { formatCurrencyPrecise } from "@/lib/currency";
import { monthKeyToDate } from "@/lib/month";

interface HeatmapExpense {
  _id?: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
}

interface HeatmapCalendarProps {
  monthKey: string;
  expenses: HeatmapExpense[];
  categoryNames: string[];
}

interface DayCell {
  date: Date | null;
  dayNumber: number | null;
  total: number;
  isOutlier: boolean;
  items: HeatmapExpense[];
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function normalizeExpenseDate(date: Date | string): Date {
  return date instanceof Date ? date : new Date(date);
}

function getDayKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

function buildExpenseMap(expenses: HeatmapExpense[]) {
  const map = new Map<string, HeatmapExpense[]>();

  for (const expense of expenses) {
    const expenseDate = normalizeExpenseDate(expense.date);

    if (Number.isNaN(expenseDate.getTime())) {
      continue;
    }

    const key = getDayKey(expenseDate);
    const existing = map.get(key) ?? [];
    existing.push({ ...expense, date: expenseDate });
    map.set(key, existing);
  }

  return map;
}

function buildMonthGrid(currentMonth: Date, expenseMap: Map<string, HeatmapExpense[]>) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const dailyTotals = monthDays.map((day) => {
    const items = expenseMap.get(getDayKey(day)) ?? [];
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    return total;
  });

  const spendingDays = dailyTotals.filter((total) => total > 0);
  const dailyAverage =
    spendingDays.length > 0
      ? spendingDays.reduce((sum, total) => sum + total, 0) / spendingDays.length
      : 0;

  const leadingPadding = monthStart.getDay();
  const cells: DayCell[] = [];

  for (let index = 0; index < leadingPadding; index += 1) {
    cells.push({
      date: null,
      dayNumber: null,
      total: 0,
      isOutlier: false,
      items: [],
    });
  }

  monthDays.forEach((day, index) => {
    const items = expenseMap.get(getDayKey(day)) ?? [];
    const total = dailyTotals[index];
    const isOutlier = total > 0 && total > dailyAverage;

    cells.push({
      date: day,
      dayNumber: day.getDate(),
      total,
      isOutlier,
      items: items.sort(
        (a, b) =>
          normalizeExpenseDate(b.date).getTime() -
          normalizeExpenseDate(a.date).getTime(),
      ),
    });
  });

  return { cells, dailyAverage };
}

function getCellClasses(total: number, isOutlier: boolean, isSelected: boolean): string {
  if (total === 0) {
    return isSelected
      ? "border border-cardBorder bg-transparent"
      : "border border-transparent bg-transparent";
  }

  if (isOutlier) {
    return isSelected
      ? "border-neonCrimson bg-neonCrimson/25 shadow-[0_0_18px_rgba(239,68,68,0.25)]"
      : "border-neonCrimson/70 bg-neonCrimson/20 shadow-[0_0_12px_rgba(239,68,68,0.12)]";
  }

  return isSelected
    ? "border-neonViolet/60 bg-card shadow-[0_0_16px_rgba(139,92,246,0.12)]"
    : "border-cardBorder bg-card hover:border-neonViolet/40";
}

interface ExpenseEditFormProps {
  item: HeatmapExpense;
  categoryNames: string[];
  onCancel: () => void;
  onSaved: () => void;
}

function ExpenseEditForm({
  item,
  categoryNames,
  onCancel,
  onSaved,
}: ExpenseEditFormProps) {
  const [amount, setAmount] = useState(String(item.amount));
  const [category, setCategory] = useState(item.category);
  const [description, setDescription] = useState(item.description);
  const [date, setDate] = useState(format(normalizeExpenseDate(item.date), "yyyy-MM-dd"));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!item._id) {
      setError("Missing expense id.");
      return;
    }

    const parsedAmount = Number.parseFloat(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid amount.");
      return;
    }

    setIsSubmitting(true);

    const result = await updateExpenseAction(item._id, {
      amount: parsedAmount,
      category,
      description,
      date,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Could not update expense.");
      return;
    }

    onSaved();
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 border-t border-cardBorder pt-3">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="rounded-lg border border-cardBorder bg-background px-3 py-2 text-sm text-zinc-100 outline-none focus:border-neonViolet"
        />
        <input
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
          className="rounded-lg border border-cardBorder bg-background px-3 py-2 text-sm text-zinc-100 outline-none focus:border-neonViolet [color-scheme:dark]"
        />
      </div>
      <select
        value={category}
        onChange={(event) => setCategory(event.target.value)}
        className="w-full rounded-lg border border-cardBorder bg-background px-3 py-2 text-sm text-zinc-100 outline-none focus:border-neonViolet"
      >
        {categoryNames.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Description"
        className="w-full rounded-lg border border-cardBorder bg-background px-3 py-2 text-sm text-zinc-100 outline-none focus:border-neonViolet"
      />
      {error && <p className="text-xs text-neonCrimson">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-cardBorder px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-lg border border-neonViolet/40 bg-neonViolet/15 px-3 py-2 text-sm font-medium text-neonViolet disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

export default function HeatmapCalendar({
  monthKey,
  expenses,
  categoryNames,
}: HeatmapCalendarProps) {
  const router = useRouter();
  const currentMonth = useMemo(() => startOfMonth(monthKeyToDate(monthKey)), [monthKey]);
  const [selectedDay, setSelectedDay] = useState<DayCell | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const expenseMap = useMemo(() => buildExpenseMap(expenses), [expenses]);

  const { cells, dailyAverage } = useMemo(
    () => buildMonthGrid(currentMonth, expenseMap),
    [currentMonth, expenseMap],
  );

  const selectedItems = selectedDay?.items ?? [];
  const selectedTotal = selectedDay?.total ?? 0;

  const handleDelete = async (id: string) => {
    setDeleteError(null);
    setDeletingId(id);
    const result = await deleteExpenseAction(id);
    setDeletingId(null);

    if (result.success) {
      setSelectedDay(null);
      setEditingId(null);
      router.refresh();
      return;
    }

    setDeleteError(result.error ?? "Could not delete expense.");
  };

  const handleSaved = () => {
    setEditingId(null);
    setSelectedDay(null);
    router.refresh();
  };

  return (
    <section className="w-full">
      <div className="rounded-2xl border border-cardBorder bg-card/50 p-4 sm:p-5">
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-neonEmerald/80">
            Cash-Flow Heatmap
          </p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-100">
            {format(currentMonth, "MMMM yyyy")}
          </h3>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-2">
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="text-center text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500"
            >
              {label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {cells.map((cell, index) => {
            if (!cell.date || cell.dayNumber === null) {
              return (
                <div
                  key={`pad-${index}`}
                  aria-hidden
                  className="aspect-square rounded-xl border border-transparent bg-transparent"
                />
              );
            }

            const isSelected =
              selectedDay?.date != null &&
              isSameDay(selectedDay.date, cell.date);

            return (
              <button
                key={getDayKey(cell.date)}
                type="button"
                aria-label={`${format(cell.date, "MMMM d, yyyy")}, ${formatCurrencyPrecise(cell.total)} spent`}
                onClick={() => {
                  setEditingId(null);
                  setDeleteError(null);
                  setSelectedDay(cell);
                }}
                className={`aspect-square rounded-xl border p-1 transition-colors ${getCellClasses(cell.total, cell.isOutlier, isSelected)}`}
              >
                <span className="block text-left text-xs font-medium text-zinc-300">
                  {cell.dayNumber}
                </span>
                {cell.total > 0 && (
                  <span
                    className={`mt-1 block truncate text-[10px] font-semibold ${
                      cell.isOutlier ? "text-neonCrimson" : "text-zinc-400"
                    }`}
                  >
                    {formatCurrencyPrecise(cell.total)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-md border border-transparent bg-transparent" />
            Rs 0 outflow
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-md border border-cardBorder bg-card" />
            Low spend
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-md border border-neonCrimson/70 bg-neonCrimson/20" />
            Spike day
          </span>
          <span>Avg active day: {formatCurrencyPrecise(dailyAverage)}</span>
        </div>
      </div>

      <AnimatePresence>
        {selectedDay?.date && (
          <>
            <motion.button
              type="button"
              aria-label="Close day details"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedDay(null);
                setEditingId(null);
              }}
              className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm"
            />

            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="heatmap-day-title"
              initial={{ opacity: 0, y: 120 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 120 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[72vh] overflow-y-auto rounded-t-3xl border border-cardBorder bg-card px-5 pb-8 pt-5 shadow-[0_-20px_60px_rgba(139,92,246,0.12)]"
            >
              <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-cardBorder" />

              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.25em] text-neonViolet/80">
                    Daily Ledger
                  </p>
                  <h4 id="heatmap-day-title" className="mt-2 text-lg font-semibold text-zinc-100">
                    {format(selectedDay.date, "EEEE, MMMM d")}
                  </h4>
                  <p className="mt-1 text-sm text-zinc-500">
                    Total outflow: {formatCurrencyPrecise(selectedTotal)}
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => {
                    setSelectedDay(null);
                    setEditingId(null);
                    setDeleteError(null);
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-cardBorder bg-background text-zinc-400 transition-colors hover:border-neonViolet/40 hover:text-zinc-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {deleteError && (
                <p className="mb-4 rounded-xl border border-neonCrimson/30 bg-neonCrimson/10 px-4 py-3 text-sm text-neonCrimson">
                  {deleteError}
                </p>
              )}

              {selectedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-cardBorder bg-background/60 px-6 py-10 text-center">
                  <ShoppingBag className="mb-3 h-8 w-8 text-zinc-600" />
                  <p className="text-sm font-medium text-zinc-300">
                    Zero absolute outflow today
                  </p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {selectedItems.map((item, index) => (
                    <li
                      key={item._id ?? `${item.category}-${item.amount}-${index}`}
                      className="rounded-2xl border border-cardBorder bg-background/70 px-4 py-3"
                    >
                      {editingId === item._id ? (
                        <ExpenseEditForm
                          item={item}
                          categoryNames={categoryNames}
                          onCancel={() => setEditingId(null)}
                          onSaved={handleSaved}
                        />
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <span className="inline-flex rounded-full border border-neonViolet/30 bg-neonViolet/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-neonViolet">
                                {item.category}
                              </span>
                              <p className="mt-2 text-sm text-zinc-300">
                                {item.description.trim() || "No description provided"}
                              </p>
                            </div>
                            <p
                              className={`shrink-0 text-sm font-semibold ${
                                selectedDay.isOutlier
                                  ? "text-neonCrimson"
                                  : "text-zinc-100"
                              }`}
                            >
                              {formatCurrencyPrecise(item.amount)}
                            </p>
                          </div>

                          {item._id && (
                            <div className="mt-3 flex gap-2 border-t border-cardBorder pt-3">
                              <button
                                type="button"
                                onClick={() => setEditingId(item._id!)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-cardBorder px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-neonViolet/40 hover:text-zinc-200"
                              >
                                <Pencil className="h-3 w-3" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(item._id!)}
                                disabled={deletingId === item._id}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-cardBorder px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-neonCrimson/40 hover:text-neonCrimson disabled:opacity-60"
                              >
                                <Trash2 className="h-3 w-3" />
                                {deletingId === item._id ? "Deleting..." : "Delete"}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}
