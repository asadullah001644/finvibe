"use client";

import { format } from "date-fns";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import ManageCategoriesModal from "@/components/ManageCategoriesModal";
import ExpenseSearchField from "@/components/ExpenseSearchField";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  deleteExpenseAction,
  updateExpenseAction,
} from "@/lib/actions";
import { useAppNavigation } from "@/components/NavigationLoadingProvider";
import CategoryBudgetPanel from "@/components/CategoryBudgetPanel";
import {
  CATEGORY_SEPARATOR,
  buildCategoryGroupsFromNames,
  getChildCategoryName,
} from "@/lib/constants";
import { formatCurrency, formatCurrencyPrecise } from "@/lib/currency";
import { compareExpensesByRecency } from "@/lib/expenseSort";
import { filterExpensesBySearch, normalizeExpenseSearchQuery } from "@/lib/expenseSearch";
import { buildCategoriesUrl } from "@/lib/navigation";
import type { BudgetCategory } from "@/lib/types";
import type { CustomCategoryRecord } from "@/lib/customCategories";

export type CategoryFilterGroup = "all" | "General" | string;

function buildGroupFilters(categoryNames: string[]) {
  const groups = buildCategoryGroupsFromNames(categoryNames);

  return [
    { id: "all" as const, label: "All" },
    ...groups
      .filter((group) => group.label !== null)
      .map((group) => ({
        id: group.label as string,
        label: group.label as string,
      })),
    ...(groups.some((group) => group.label === null)
      ? [{ id: "General" as const, label: "General" }]
      : []),
  ];
}

interface ExplorerExpense {
  _id?: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  createdAt?: Date;
}

interface CategoryExplorerProps {
  monthKey: string;
  expenses: ExplorerExpense[];
  categories: BudgetCategory[];
  customCategories: CustomCategoryRecord[];
  isSuperAdmin: boolean;
}

function normalizeExpenseDate(date: Date | string): Date {
  return date instanceof Date ? date : new Date(date);
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

function formatFilterLabel(
  activeGroup: CategoryFilterGroup,
  activeCategory: string | null,
): string {
  if (activeCategory) {
    return getChildCategoryName(activeCategory);
  }

  if (activeGroup === "all") {
    return "All categories";
  }

  return activeGroup;
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
  onSaved: () => void | Promise<void>;
}) {
  const categoryGroups = buildCategoryGroupsFromNames(categoryNames)
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
      setIsSubmitting(false);
      return;
    }

    await onSaved();
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-3 border-t border-cardBorder pt-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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

function getActiveCategoryNames(
  expenses: ExplorerExpense[],
  group: CategoryFilterGroup,
  activeCategory: string | null,
): string[] {
  if (activeCategory) {
    return [activeCategory];
  }

  if (group === "all") {
    return [];
  }

  return [
    ...new Set(
      expenses
        .filter((expense) => expenseMatchesGroup(expense, group))
        .map((expense) => expense.category),
    ),
  ];
}

function readFiltersFromSearchParams(searchParams: URLSearchParams): {
  group: CategoryFilterGroup;
  category: string | null;
} {
  const categories = searchParams.getAll("category");
  const groupParam = searchParams.get("group");
  const category = categories[0] ?? null;

  return {
    group: category ? "all" : (groupParam ?? "all"),
    category,
  };
}

export default function CategoryExplorer({
  monthKey,
  expenses,
  categories,
  customCategories,
  isSuperAdmin,
}: CategoryExplorerProps) {
  const categoryNames = categories.map((category) => category.name);
  const groupFilters = useMemo(
    () => buildGroupFilters(categoryNames),
    [categoryNames],
  );
  const searchParams = useSearchParams();
  const { refresh } = useAppNavigation();

  const urlFilters = readFiltersFromSearchParams(searchParams);
  const [activeGroup, setActiveGroup] =
    useState<CategoryFilterGroup>(urlFilters.group);
  const [activeCategory, setActiveCategory] = useState<string | null>(
    urlFilters.category,
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileSection, setMobileSection] = useState<"categories" | "expenses">(
    "categories",
  );

  useEffect(() => {
    setActiveGroup(urlFilters.group);
    setActiveCategory(urlFilters.category);
  }, [urlFilters.group, urlFilters.category]);

  const filteredExpenses = useMemo(() => {
    const categoryFiltered = expenses
      .filter((expense) =>
        expenseMatchesFilter(expense, activeGroup, activeCategory),
      )
      .sort(compareExpensesByRecency);

    return filterExpensesBySearch(categoryFiltered, searchQuery);
  }, [activeCategory, activeGroup, expenses, searchQuery]);

  const hasSearchQuery = normalizeExpenseSearchQuery(searchQuery).length > 0;

  const totalSpent = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );
  const monthlyTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const activeCategoryNames = getActiveCategoryNames(
    expenses,
    activeGroup,
    activeCategory,
  );

  const syncFilterToUrl = (
    group: CategoryFilterGroup,
    category: string | null,
  ) => {
    const nextUrl = buildCategoriesUrl(monthKey, {
      group: !category && group !== "all" ? group : undefined,
      category: category ?? undefined,
    });

    window.history.replaceState(null, "", nextUrl);
  };

  const applyGroupFilter = (group: CategoryFilterGroup) => {
    setActiveGroup(group);
    setActiveCategory(null);
    syncFilterToUrl(group, null);
    setMobileSection("expenses");
  };

  const applyCategoryFilter = (category: string | null) => {
    setActiveGroup("all");
    setActiveCategory(category);
    syncFilterToUrl("all", category);
    if (category) {
      setMobileSection("expenses");
    }
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
    await refresh();
  };

  const handleSaved = async () => {
    setEditingId(null);
    await refresh();
  };

  const filterLabel = formatFilterLabel(activeGroup, activeCategory);
  const hasActiveFilter = activeCategory !== null || activeGroup !== "all";

  const handleSelectCategory = (categoryName: string) => {
    if (activeCategory === categoryName) {
      applyCategoryFilter(null);
      return;
    }

    applyCategoryFilter(categoryName);
  };

  const handleClearFilter = () => {
    applyGroupFilter("all");
  };

  const showCategoryOnExpense = !activeCategory;

  return (
    <div className="space-y-4 lg:space-y-6">
      {isSuperAdmin && (
        <ManageCategoriesModal
          isOpen={manageCategoriesOpen}
          onClose={() => setManageCategoriesOpen(false)}
          customCategories={customCategories}
        />
      )}

      <header className="rounded-2xl border border-cardBorder bg-card/60 px-4 py-4 sm:px-5">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
          This month
        </p>
        <p className="mt-1 text-3xl font-bold tracking-tight text-neonCrimson">
          {formatCurrency(monthlyTotal)}
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          {expenses.length} expense{expenses.length === 1 ? "" : "s"} logged
        </p>
      </header>

      <div className="flex gap-2 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileSection("categories")}
          className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
            mobileSection === "categories"
              ? "border-neonViolet/40 bg-neonViolet/15 text-neonViolet"
              : "border-cardBorder bg-card/40 text-zinc-400"
          }`}
        >
          By category
        </button>
        <button
          type="button"
          onClick={() => setMobileSection("expenses")}
          className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
            mobileSection === "expenses"
              ? "border-neonViolet/40 bg-neonViolet/15 text-neonViolet"
              : "border-cardBorder bg-card/40 text-zinc-400"
          }`}
        >
          Expenses ({filteredExpenses.length})
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-start lg:gap-8">
        <section
          className={`rounded-2xl border border-cardBorder bg-card/60 p-4 sm:p-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto ${
            mobileSection === "expenses" ? "hidden lg:block" : ""
          }`}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">
                By category
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Tap a category to see its expenses
              </p>
            </div>
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => setManageCategoriesOpen(true)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-neonViolet/40 bg-neonViolet/15 px-3 py-2 text-xs font-semibold text-neonViolet transition-colors hover:bg-neonViolet/25 sm:text-sm"
              >
                <Plus className="h-4 w-4" />
                Add category
              </button>
            )}
          </div>
          <CategoryBudgetPanel
            categories={categories}
            expenses={expenses}
            activeCategoryNames={activeCategoryNames}
            onSelectCategory={handleSelectCategory}
            compact
          />
        </section>

        <section
          className={`rounded-2xl border border-cardBorder bg-card/60 p-4 sm:p-5 ${
            mobileSection === "categories" ? "hidden lg:block" : ""
          }`}
        >
          <div className="mb-4">
            <h2 className="text-base font-semibold text-zinc-100">Expenses</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {hasSearchQuery
                ? `${filteredExpenses.length} result${filteredExpenses.length === 1 ? "" : "s"} for "${searchQuery.trim()}"`
                : hasActiveFilter
                  ? `${filteredExpenses.length} in ${filterLabel} · ${formatCurrency(totalSpent)}`
                  : `All ${expenses.length} expenses this month`}
            </p>
          </div>

          <ExpenseSearchField
            value={searchQuery}
            onChange={setSearchQuery}
            className="mb-3"
          />

          <div className="mb-4 flex flex-wrap items-center gap-2">
            {groupFilters.map((filter) => {
              const isActive =
                !activeCategory &&
                (filter.id === "all"
                  ? activeGroup === "all"
                  : activeGroup === filter.id);

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => applyGroupFilter(filter.id)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? "border-neonViolet/40 bg-neonViolet/15 text-neonViolet"
                      : "border-cardBorder bg-background/40 text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {filter.label}
                </button>
              );
            })}

            {activeCategory && (
              <>
                <span className="text-xs text-zinc-600">·</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-neonViolet/30 bg-neonViolet/10 px-3 py-1.5 text-xs font-medium text-neonViolet">
                  {filterLabel}
                  <button
                    type="button"
                    onClick={handleClearFilter}
                    className="rounded-full px-1 text-neonViolet/80 hover:text-neonViolet"
                    aria-label="Clear category filter"
                  >
                    ×
                  </button>
                </span>
              </>
            )}
          </div>

          {deleteError && (
            <p className="mb-4 rounded-xl border border-neonCrimson/30 bg-neonCrimson/10 px-4 py-3 text-sm text-neonCrimson">
              {deleteError}
            </p>
          )}

          {expenses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-cardBorder bg-background/40 px-4 py-10 text-center text-sm text-zinc-500">
              No expenses logged yet this month.
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-cardBorder bg-background/40 px-4 py-10 text-center text-sm text-zinc-500">
              {hasSearchQuery ? (
                <>
                  No expenses match &ldquo;{searchQuery.trim()}&rdquo;.{" "}
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="font-medium text-neonViolet hover:underline"
                  >
                    Clear search
                  </button>
                </>
              ) : (
                <>
                  No expenses match this filter.{" "}
                  <button
                    type="button"
                    onClick={handleClearFilter}
                    className="font-medium text-neonViolet hover:underline"
                  >
                    Show all
                  </button>
                </>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-cardBorder/70 overflow-hidden rounded-xl border border-cardBorder/80">
              {filteredExpenses.map((item, index) => (
                <li
                  key={item._id ?? `${item.category}-${item.amount}-${index}`}
                  className="bg-background/30 px-3 py-3 sm:px-4"
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
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span className="text-xs font-medium text-zinc-500">
                              {format(normalizeExpenseDate(item.date), "MMM d")}
                            </span>
                            {showCategoryOnExpense && (
                              <span className="text-xs font-medium text-neonViolet/90">
                                {getChildCategoryName(item.category)}
                              </span>
                            )}
                          </div>
                          <p className="mt-1 line-clamp-2 text-sm text-zinc-200">
                            {item.description.trim() || "No description"}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold tabular-nums text-zinc-100">
                          {formatCurrencyPrecise(item.amount)}
                        </p>
                      </div>

                      {item._id && (
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(item._id ?? null)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-background/80 hover:text-zinc-300"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={deletingId === item._id}
                            onClick={() => handleDelete(item._id!)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-neonCrimson/10 hover:text-neonCrimson disabled:opacity-60"
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
      </div>
    </div>
  );
}
