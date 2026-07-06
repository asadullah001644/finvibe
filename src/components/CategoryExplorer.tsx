"use client";

import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Filter, Loader2, Pencil, Trash2 } from "lucide-react";
import {
  categorySectionLabelClass,
  CategoryPickerPanel,
  groupFilterChipClass,
} from "@/components/CategoryPickerUI";
import {
  ModalBackdrop,
  ModalFooter,
  ModalHeader,
  getModalMotionProps,
  modalShellClass,
  useIsDesktop,
} from "@/components/ui/modal";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  deleteExpenseAction,
  updateExpenseAction,
} from "@/lib/actions";
import { useAppNavigation } from "@/components/NavigationLoadingProvider";
import {
  CATEGORY_SEPARATOR,
  getCategoryGroups,
  getChildCategoryName,
} from "@/lib/constants";
import { formatCurrency, formatCurrencyPrecise } from "@/lib/currency";
import { compareExpensesByRecency } from "@/lib/expenseSort";
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
  createdAt?: Date;
}

interface CategoryExplorerProps {
  monthKey: string;
  expenses: ExplorerExpense[];
  categoryNames: string[];
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
  categories: string[],
): boolean {
  if (categories.length > 0) {
    return categories.includes(expense.category);
  }

  return expenseMatchesGroup(expense, group);
}

function formatFilterLabel(
  activeGroup: CategoryFilterGroup,
  activeCategories: string[],
): string {
  if (activeCategories.length === 1) {
    return getChildCategoryName(activeCategories[0]!);
  }

  if (activeCategories.length > 1) {
    return `${activeCategories.length} categories`;
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

interface CategoryFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryNames: string[];
  appliedGroup: CategoryFilterGroup;
  appliedCategories: string[];
  onApply: (group: CategoryFilterGroup, categories: string[]) => void;
  isApplying: boolean;
}

function CategoryFilterModal({
  isOpen,
  onClose,
  categoryNames,
  appliedGroup,
  appliedCategories,
  onApply,
  isApplying,
}: CategoryFilterModalProps) {
  const [mounted, setMounted] = useState(false);
  const [draftGroup, setDraftGroup] = useState<CategoryFilterGroup>(appliedGroup);
  const [draftCategories, setDraftCategories] =
    useState<string[]>(appliedCategories);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setDraftGroup(appliedGroup);
    setDraftCategories(appliedCategories);
  }, [isOpen, appliedGroup, appliedCategories]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleGroupChange = (group: CategoryFilterGroup) => {
    setDraftGroup(group);
    setDraftCategories([]);
  };

  const handleCategoryToggle = (category: string) => {
    setDraftCategories((current) =>
      current.includes(category)
        ? current.filter((name) => name !== category)
        : [...current, category],
    );
    setDraftGroup("all");
  };

  const handleClearFilters = () => {
    setDraftGroup("all");
    setDraftCategories([]);
  };

  const handleDone = () => {
    onApply(draftGroup, draftCategories);
  };

  const categoryGroups = useMemo(
    () =>
      getCategoryGroups()
        .map((group) => ({
          ...group,
          items: group.items.filter((name) => categoryNames.includes(name)),
        }))
        .filter((group) => group.items.length > 0),
    [categoryNames],
  );

  const draftSummary =
    draftCategories.length > 0
      ? `${draftCategories.length} categor${draftCategories.length === 1 ? "y" : "ies"} selected`
      : draftGroup === "all"
        ? "All categories"
        : `${draftGroup} group`;

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          <ModalBackdrop
            onClose={onClose}
            label="Close category filters"
            disabled={isApplying}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-filter-title"
            {...getModalMotionProps(isDesktop)}
            className={modalShellClass("36rem")}
          >
            <ModalHeader onClose={onClose} closeDisabled={isApplying}>
              <h2
                id="category-filter-title"
                className="text-lg font-semibold tracking-tight text-zinc-100 lg:text-xl"
              >
                Filter categories
              </h2>
              <p className="mt-1 text-sm text-zinc-500">{draftSummary}</p>
            </ModalHeader>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 lg:px-6">
              <div className="space-y-4 pb-1">
                <section>
                  <p className={categorySectionLabelClass}>Quick filters</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {GROUP_FILTERS.map((filter) => {
                      const isActive =
                        draftCategories.length === 0 && draftGroup === filter.id;

                      return (
                        <button
                          key={filter.id}
                          type="button"
                          disabled={isApplying}
                          onClick={() => handleGroupChange(filter.id)}
                          className={`${groupFilterChipClass(isActive)} disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                          {filter.label}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <p className={categorySectionLabelClass}>
                    Specific categories
                    <span className="ml-1 normal-case tracking-normal text-zinc-600">
                      (select multiple)
                    </span>
                  </p>
                  <div className="rounded-2xl border border-cardBorder/70 bg-[#0C0C0F]/60 p-3 ring-1 ring-white/[0.02] sm:p-3.5">
                    <CategoryPickerPanel
                      mode="multiple"
                      groups={categoryGroups}
                      selectedCategories={draftCategories}
                      onSelect={handleCategoryToggle}
                      disabled={isApplying}
                    />
                  </div>
                </section>
              </div>
            </div>

            <ModalFooter>
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  disabled={
                    isApplying ||
                    (draftCategories.length === 0 && draftGroup === "all")
                  }
                  className="inline-flex min-h-11 items-center px-1 text-sm text-zinc-500 transition-colors hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear all
                </button>
                <button
                  type="button"
                  onClick={handleDone}
                  disabled={isApplying}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-neonViolet/40 bg-neonViolet/15 px-5 py-2.5 text-sm font-semibold text-neonViolet transition-colors hover:bg-neonViolet/25 disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-[10rem] sm:flex-none"
                >
                  {isApplying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Applying
                    </>
                  ) : (
                    "Apply"
                  )}
                </button>
              </div>
            </ModalFooter>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) {
    return null;
  }

  return createPortal(modal, document.body);
}

function readFiltersFromSearchParams(
  searchParams: URLSearchParams,
): { group: CategoryFilterGroup; categories: string[] } {
  const groupParam = searchParams.get("group");
  const group =
    groupParam === "Home" ||
    groupParam === "Flat" ||
    groupParam === "General"
      ? groupParam
      : "all";

  return {
    group,
    categories: searchParams.getAll("category"),
  };
}

export default function CategoryExplorer({
  monthKey,
  expenses,
  categoryNames,
}: CategoryExplorerProps) {
  const searchParams = useSearchParams();
  const { refresh } = useAppNavigation();

  const urlFilters = readFiltersFromSearchParams(searchParams);
  const [appliedGroup, setAppliedGroup] =
    useState<CategoryFilterGroup>(urlFilters.group);
  const [appliedCategories, setAppliedCategories] = useState<string[]>(
    urlFilters.categories,
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);

  useEffect(() => {
    setAppliedGroup(urlFilters.group);
    setAppliedCategories(urlFilters.categories);
  }, [urlFilters.group, urlFilters.categories.join("|")]);

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((expense) =>
        expenseMatchesFilter(expense, appliedGroup, appliedCategories),
      )
      .sort(compareExpensesByRecency);
  }, [appliedCategories, appliedGroup, expenses]);

  const totalSpent = filteredExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );
  const monthlyTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const spendShare =
    monthlyTotal > 0 ? Math.round((totalSpent / monthlyTotal) * 100) : 0;

  const handleApplyFilters = async (
    group: CategoryFilterGroup,
    categories: string[],
  ) => {
    setIsApplyingFilters(true);

    const nextUrl = buildCategoriesUrl(monthKey, {
      group: group === "all" ? undefined : group,
      categories: categories.length > 0 ? categories : undefined,
    });

    setAppliedGroup(group);
    setAppliedCategories(categories);
    window.history.replaceState(null, "", nextUrl);

    await refresh();

    setIsApplyingFilters(false);
    setFilterOpen(false);
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

  const filterLabel = formatFilterLabel(appliedGroup, appliedCategories);

  return (
    <section className="rounded-2xl border border-cardBorder bg-card/60 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-neonViolet/80">
            Category Explorer
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Browse and manage expenses by category
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFilterOpen(true)}
          disabled={isApplyingFilters}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-neonViolet/30 bg-neonViolet/10 px-4 py-2.5 text-sm font-medium text-neonViolet transition-colors hover:bg-neonViolet/20 disabled:cursor-not-allowed disabled:opacity-60 lg:min-h-0 lg:px-3 lg:py-2 lg:text-xs"
        >
          <Filter className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
          {filterLabel}
        </button>
      </div>

      <CategoryFilterModal
        isOpen={filterOpen}
        onClose={() => {
          if (!isApplyingFilters) {
            setFilterOpen(false);
          }
        }}
        categoryNames={categoryNames}
        appliedGroup={appliedGroup}
        appliedCategories={appliedCategories}
        onApply={handleApplyFilters}
        isApplying={isApplyingFilters}
      />

      <div className="mb-5 grid grid-cols-2 gap-3">
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
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-cardBorder px-3.5 py-2 text-sm text-zinc-400 hover:text-zinc-200 lg:min-h-0 lg:gap-1.5 lg:py-1.5 lg:text-xs"
                      >
                        <Pencil className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === item._id}
                        onClick={() => handleDelete(item._id!)}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-neonCrimson/30 px-3.5 py-2 text-sm text-neonCrimson hover:bg-neonCrimson/10 disabled:opacity-60 lg:min-h-0 lg:gap-1.5 lg:py-1.5 lg:text-xs"
                      >
                        <Trash2 className="h-4 w-4 lg:h-3.5 lg:w-3.5" />
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
