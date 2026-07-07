"use client";

import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Filter, Loader2, Pencil, Trash2, X } from "lucide-react";
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
import CategoryBudgetPanel from "@/components/CategoryBudgetPanel";
import {
  CATEGORY_SEPARATOR,
  buildCategoryGroupsFromNames,
  getChildCategoryName,
} from "@/lib/constants";
import { formatCurrency, formatCurrencyPrecise } from "@/lib/currency";
import { compareExpensesByRecency } from "@/lib/expenseSort";
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

interface CategoryFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryNames: string[];
  groupFilters: Array<{ id: CategoryFilterGroup; label: string }>;
  appliedGroup: CategoryFilterGroup;
  appliedCategories: string[];
  onApply: (group: CategoryFilterGroup, categories: string[]) => void;
  isApplying: boolean;
}

function CategoryFilterModal({
  isOpen,
  onClose,
  categoryNames,
  groupFilters,
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
      buildCategoryGroupsFromNames(categoryNames)
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
                    {groupFilters.map((filter) => {
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

function getActiveCategoryNames(
  expenses: ExplorerExpense[],
  group: CategoryFilterGroup,
  selectedCategories: string[],
): string[] {
  if (selectedCategories.length > 0) {
    return selectedCategories;
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

function readFiltersFromSearchParams(
  searchParams: URLSearchParams,
): { group: CategoryFilterGroup; categories: string[] } {
  const groupParam = searchParams.get("group");
  const group: CategoryFilterGroup = groupParam ?? "all";

  return {
    group,
    categories: searchParams.getAll("category"),
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
  const [mobileSection, setMobileSection] = useState<"categories" | "expenses">(
    "categories",
  );

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
  const activeCategoryNames = getActiveCategoryNames(
    expenses,
    appliedGroup,
    appliedCategories,
  );

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
  const hasActiveFilter =
    appliedCategories.length > 0 || appliedGroup !== "all";

  const handleSelectCategory = (categoryName: string) => {
    if (
      appliedCategories.length === 1 &&
      appliedCategories[0] === categoryName
    ) {
      void handleApplyFilters("all", []);
      return;
    }

    void handleApplyFilters("all", [categoryName]);
    setMobileSection("expenses");
  };

  const handleClearFilter = () => {
    void handleApplyFilters("all", []);
  };

  const handleQuickGroup = (group: CategoryFilterGroup) => {
    void handleApplyFilters(group, []);
    setMobileSection("expenses");
  };

  const showCategoryOnExpense =
    appliedCategories.length !== 1 && appliedGroup === "all";

  return (
    <div className="space-y-4 lg:space-y-6">
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

        {hasActiveFilter && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-neonViolet/30 bg-neonViolet/10 py-1.5 pl-3 pr-1.5 text-sm text-neonViolet">
              <span>
                {filterLabel} · {formatCurrency(totalSpent)}
              </span>
              <button
                type="button"
                onClick={handleClearFilter}
                className="rounded-full p-1 transition-colors hover:bg-neonViolet/20"
                aria-label="Clear filter"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          </div>
        )}
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
          <h2 className="mb-1 text-base font-semibold text-zinc-100">
            By category
          </h2>
          <p className="mb-4 text-sm text-zinc-500">
            Tap a category to see its expenses
          </p>
          <CategoryBudgetPanel
            categories={categories}
            expenses={expenses}
            activeCategoryNames={activeCategoryNames}
            customCategories={customCategories}
            isSuperAdmin={isSuperAdmin}
            onSelectCategory={handleSelectCategory}
            compact
          />
        </section>

        <section
          className={`rounded-2xl border border-cardBorder bg-card/60 p-4 sm:p-5 ${
            mobileSection === "categories" ? "hidden lg:block" : ""
          }`}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Expenses</h2>
              <p className="mt-1 text-sm text-zinc-500">
                {hasActiveFilter
                  ? `${filteredExpenses.length} matching ${filteredExpenses.length === 1 ? "entry" : "entries"}`
                  : "All expenses this month"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              disabled={isApplyingFilters}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-cardBorder bg-background/50 px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-neonViolet/30 hover:text-neonViolet disabled:opacity-60"
            >
              <Filter className="h-3.5 w-3.5" />
              More filters
            </button>
          </div>

          {!hasActiveFilter && (
            <div className="mb-4 flex flex-wrap gap-2">
              {groupFilters.map((filter) => {
                const isActive =
                  appliedCategories.length === 0 && appliedGroup === filter.id;

                return (
                  <button
                    key={filter.id}
                    type="button"
                    disabled={isApplyingFilters}
                    onClick={() => handleQuickGroup(filter.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                      isActive
                        ? "border-neonViolet/40 bg-neonViolet/15 text-neonViolet"
                        : "border-cardBorder bg-background/40 text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>
          )}

          <CategoryFilterModal
            isOpen={filterOpen}
            onClose={() => {
              if (!isApplyingFilters) {
                setFilterOpen(false);
              }
            }}
            categoryNames={categoryNames}
            groupFilters={groupFilters}
            appliedGroup={appliedGroup}
            appliedCategories={appliedCategories}
            onApply={handleApplyFilters}
            isApplying={isApplyingFilters}
          />

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
              No expenses match this filter.{" "}
              <button
                type="button"
                onClick={handleClearFilter}
                className="font-medium text-neonViolet hover:underline"
              >
                Show all
              </button>
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
