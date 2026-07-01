"use client";

import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  deleteExpenseAction,
  updateExpenseAction,
} from "@/lib/actions";
import {
  CATEGORY_SEPARATOR,
  getCategoryGroups,
  getChildCategoryName,
  getParentCategoryName,
} from "@/lib/constants";
import { formatCurrency, formatCurrencyPrecise } from "@/lib/currency";
import { buildCategoriesUrl } from "@/lib/navigation";

export type CategoryFilterGroup = "all" | "Home" | "Flat" | "General";

const GROUP_FILTERS: Array<{ id: CategoryFilterGroup; label: string }> = [
  { id: "all", label: "All" },
  { id: "Home", label: "Home" },
  { id: "Flat", label: "Flat" },
  { id: "General", label: "General" },
];

interface ExplorerExpense {
  _id?: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
}

interface CategoryExplorerProps {
  monthKey: string;
  expenses: ExplorerExpense[];
  categoryNames: string[];
}

function normalizeExpenseDate(date: Date | string): Date {
  return date instanceof Date ? date : new Date(date);
}

function inferGroupFromCategory(category: string): CategoryFilterGroup {
  const parent = getParentCategoryName(category);
  if (parent === "Home" || parent === "Flat") {
    return parent;
  }
  return "General";
}

function expenseMatchesGroup(
  expense: ExplorerExpense,
  group: CategoryFilterGroup,
): boolean {
  if (group === "all") {
    return true;
  }

  if (group === "General") {
    return !expense.category.includes(CATEGORY_SEPARATOR);
  }

  return expense.category.startsWith(`${group}${CATEGORY_SEPARATOR}`);
}

function expenseMatchesFilter(
  expense: ExplorerExpense,
  group: CategoryFilterGroup,
  category: string | null,
): boolean {
  if (category) {
    return expense.category === category;
  }

  return expenseMatchesGroup(expense, group);
}

function ExpenseEditForm({
  item,
  categoryNames,
  onCancel,
  onSaved,
}: {
  item: ExplorerExpense;
  categoryNames: string[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const categoryGroups = getCategoryGroups()
    .map((group) => ({
      ...group,
      items: group.items.filter((name) => categoryNames.includes(name)),
    }))
    .filter((group) => group.items.length > 0);

  const [amount, setAmount] = useState(String(item.amount));
  const [category, setCategory] = useState(item.category);
  const [description, setDescription] = useState(item.description);
  const [date, setDate] = useState(
    format(normalizeExpenseDate(item.date), "yyyy-MM-dd"),
  );
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
        {categoryGroups.map((group) =>
          group.label ? (
            <optgroup key={group.label} label={group.label}>
              {group.items.map((name) => (
                <option key={name} value={name}>
                  {getChildCategoryName(name)}
                </option>
              ))}
            </optgroup>
          ) : (
            group.items.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))
          ),
        )}
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

export default function CategoryExplorer({
  monthKey,
  expenses,
  categoryNames,
}: CategoryExplorerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeGroup = (searchParams.get("group") as CategoryFilterGroup) || "all";
  const activeCategory = searchParams.get("category");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const leafOptions = useMemo(() => {
    if (activeGroup === "all") {
      return categoryNames;
    }

    if (activeGroup === "General") {
      return categoryNames.filter((name) => !name.includes(CATEGORY_SEPARATOR));
    }

    return categoryNames.filter((name) =>
      name.startsWith(`${activeGroup}${CATEGORY_SEPARATOR}`),
    );
  }, [activeGroup, categoryNames]);

  const filteredExpenses = useMemo(() => {
    const resolvedGroup =
      activeCategory && activeGroup === "all"
        ? inferGroupFromCategory(activeCategory)
        : activeGroup;

    return expenses
      .filter((expense) =>
        expenseMatchesFilter(expense, resolvedGroup, activeCategory),
      )
      .sort(
        (left, right) =>
          normalizeExpenseDate(right.date).getTime() -
          normalizeExpenseDate(left.date).getTime(),
      );
  }, [activeCategory, activeGroup, expenses]);

  const totalSpent = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );
  const monthlyTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const spendShare =
    monthlyTotal > 0 ? Math.round((totalSpent / monthlyTotal) * 100) : 0;

  const updateFilters = (group: CategoryFilterGroup, category?: string | null) => {
    router.push(
      buildCategoriesUrl(monthKey, {
        group: group === "all" ? undefined : group,
        category: category ?? undefined,
      }),
    );
  };

  const handleGroupChange = (group: CategoryFilterGroup) => {
    updateFilters(group, null);
  };

  const handleCategoryChange = (category: string | null) => {
    if (!category) {
      updateFilters(activeGroup === "all" ? "all" : activeGroup, null);
      return;
    }

    updateFilters(inferGroupFromCategory(category), category);
  };

  const handleDelete = async (id: string) => {
    setDeleteError(null);
    setDeletingId(id);

    const result = await deleteExpenseAction(id);

    setDeletingId(null);

    if (!result.success) {
      setDeleteError(result.error ?? "Could not delete expense.");
      return;
    }

    setEditingId(null);
    router.refresh();
  };

  const handleSaved = () => {
    setEditingId(null);
    router.refresh();
  };

  const filterLabel = activeCategory
    ? getChildCategoryName(activeCategory)
    : activeGroup === "all"
      ? "All categories"
      : activeGroup;

  return (
    <section className="rounded-2xl border border-cardBorder bg-card/60 p-4 sm:p-5">
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-neonViolet/80">
          Category Explorer
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Filter and browse expenses by Home, Flat, or individual category
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {GROUP_FILTERS.map((filter) => {
          const isActive = activeGroup === filter.id && !activeCategory;

          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => handleGroupChange(filter.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                isActive
                  ? "border-neonViolet bg-neonViolet/15 text-neonViolet"
                  : "border-cardBorder bg-background text-zinc-400 hover:border-neonViolet/40 hover:text-zinc-200"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      {leafOptions.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleCategoryChange(null)}
            className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
              !activeCategory
                ? "border-neonEmerald/40 bg-neonEmerald/10 text-neonEmerald"
                : "border-cardBorder bg-background text-zinc-500 hover:text-zinc-300"
            }`}
          >
            All in group
          </button>
          {leafOptions.map((name) => {
            const isActive = activeCategory === name;

            return (
              <button
                key={name}
                type="button"
                onClick={() => handleCategoryChange(name)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "border-neonEmerald/40 bg-neonEmerald/10 text-neonEmerald"
                    : "border-cardBorder bg-background text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {getChildCategoryName(name)}
              </button>
            );
          })}
        </div>
      )}

      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-cardBorder bg-background/60 px-3 py-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            Filter
          </p>
          <p className="mt-1 text-sm font-medium text-zinc-200">{filterLabel}</p>
        </div>
        <div className="rounded-xl border border-cardBorder bg-background/60 px-3 py-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            Total spent
          </p>
          <p className="mt-1 text-sm font-semibold text-neonCrimson">
            {formatCurrency(totalSpent)}
          </p>
        </div>
        <div className="rounded-xl border border-cardBorder bg-background/60 px-3 py-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            Transactions
          </p>
          <p className="mt-1 text-sm font-semibold text-zinc-200">
            {filteredExpenses.length}
            {monthlyTotal > 0 && (
              <span className="ml-1 text-xs font-normal text-zinc-500">
                ({spendShare}% of month)
              </span>
            )}
          </p>
        </div>
      </div>

      {deleteError && (
        <p className="mb-4 rounded-xl border border-neonCrimson/30 bg-neonCrimson/10 px-4 py-3 text-sm text-neonCrimson">
          {deleteError}
        </p>
      )}

      {expenses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-cardBorder bg-background/40 px-4 py-8 text-center text-sm text-zinc-500">
          No expenses logged this month yet.
        </div>
      ) : filteredExpenses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-cardBorder bg-background/40 px-4 py-8 text-center text-sm text-zinc-500">
          No expenses match this category filter.
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredExpenses.map((item, index) => (
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
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex rounded-full border border-neonViolet/30 bg-neonViolet/10 px-2.5 py-1 text-[11px] font-medium text-neonViolet">
                          {getChildCategoryName(item.category)}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {format(normalizeExpenseDate(item.date), "MMM d, yyyy")}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-zinc-300">
                        {item.description.trim() || "No description provided"}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-zinc-100">
                      {formatCurrencyPrecise(item.amount)}
                    </p>
                  </div>

                  {item._id && (
                    <div className="mt-3 flex gap-2 border-t border-cardBorder pt-3">
                      <button
                        type="button"
                        onClick={() => setEditingId(item._id ?? null)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-cardBorder px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === item._id}
                        onClick={() => handleDelete(item._id!)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-neonCrimson/30 px-3 py-1.5 text-xs text-neonCrimson hover:bg-neonCrimson/10 disabled:opacity-60"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
    </section>
  );
}
