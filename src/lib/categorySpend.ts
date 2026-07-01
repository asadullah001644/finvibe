import {
  getCategoryGroups,
  getChildCategoryName,
} from "@/lib/constants";
import type { BudgetCategory } from "@/lib/types";

export interface CategoryExpense {
  amount: number;
  category: string;
}

export interface CategoryRow {
  name: string;
  displayName: string;
  spent: number;
  allocated: number;
  percent: number | null;
  isOver: boolean;
  isChild?: boolean;
  shareOfMonth: number;
}

export interface CategoryGroupRow {
  label: string | null;
  rollup?: CategoryRow;
  items: CategoryRow[];
}

export function sumExpenses(expenses: CategoryExpense[]): number {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

function buildCategoryRow(
  name: string,
  displayName: string,
  spentByCategory: Record<string, number>,
  allocatedByCategory: Record<string, number>,
  totalSpent: number,
  isChild = false,
): CategoryRow {
  const spent = spentByCategory[name] ?? 0;
  const allocated = allocatedByCategory[name] ?? 0;
  const percent = allocated > 0 ? Math.round((spent / allocated) * 100) : null;
  const shareOfMonth =
    totalSpent > 0 ? Math.round((spent / totalSpent) * 100) : 0;

  return {
    name,
    displayName,
    spent,
    allocated,
    percent,
    isOver: allocated > 0 && spent > allocated,
    isChild,
    shareOfMonth,
  };
}

function sortRowsBySpend(rows: CategoryRow[]): CategoryRow[] {
  return [...rows].sort((left, right) => {
    if (right.spent !== left.spent) {
      return right.spent - left.spent;
    }

    return left.displayName.localeCompare(right.displayName);
  });
}

export function buildGroupedCategoryRows(
  categories: BudgetCategory[],
  expenses: CategoryExpense[],
): { groups: CategoryGroupRow[]; totalSpent: number } {
  const spentByCategory = expenses.reduce<Record<string, number>>(
    (accumulator, expense) => {
      accumulator[expense.category] =
        (accumulator[expense.category] ?? 0) + expense.amount;
      return accumulator;
    },
    {},
  );

  const totalSpent = sumExpenses(expenses);

  const allocatedByCategory = categories.reduce<Record<string, number>>(
    (accumulator, category) => {
      accumulator[category.name] = category.allocated;
      return accumulator;
    },
    {},
  );

  const knownNames = new Set(categories.map((category) => category.name));
  const groups: CategoryGroupRow[] = [];
  const generalItems: CategoryRow[] = [];

  for (const group of getCategoryGroups()) {
    const items = sortRowsBySpend(
      group.items
        .map((name) =>
          buildCategoryRow(
            name,
            group.label ? getChildCategoryName(name) : name,
            spentByCategory,
            allocatedByCategory,
            totalSpent,
            Boolean(group.label),
          ),
        )
        .filter((row) => row.spent > 0 || row.allocated > 0),
    );

    if (items.length === 0) {
      continue;
    }

    if (!group.label) {
      generalItems.push(...items);
      continue;
    }

    const rollupSpent = items.reduce((sum, row) => sum + row.spent, 0);
    const rollupAllocated = items.reduce(
      (sum, row) => sum + row.allocated,
      0,
    );

    groups.push({
      label: group.label,
      rollup: buildCategoryRow(
        group.label,
        group.label,
        { [group.label]: rollupSpent },
        { [group.label]: rollupAllocated },
        totalSpent,
      ),
      items,
    });
  }

  if (generalItems.length > 0) {
    const items = sortRowsBySpend(generalItems);
    const rollupSpent = items.reduce((sum, row) => sum + row.spent, 0);
    const rollupAllocated = items.reduce((sum, row) => sum + row.allocated, 0);

    groups.push({
      label: "General",
      rollup: buildCategoryRow(
        "General",
        "General",
        { General: rollupSpent },
        { General: rollupAllocated },
        totalSpent,
      ),
      items,
    });
  }

  const extraItems = sortRowsBySpend(
    Object.entries(spentByCategory)
      .filter(([name, spent]) => spent > 0 && !knownNames.has(name))
      .map(([name, spent]) =>
        buildCategoryRow(
          name,
          name,
          { [name]: spent },
          {},
          totalSpent,
        ),
      ),
  );

  if (extraItems.length > 0) {
    groups.push({
      label: "Other categories",
      items: extraItems,
    });
  }

  return { groups, totalSpent };
}

export function flattenCategoryRows(groups: CategoryGroupRow[]): CategoryRow[] {
  return groups.flatMap((group) => group.items);
}

function recalculateRollup(
  label: string,
  items: CategoryRow[],
  totalSpent: number,
): CategoryRow {
  const rollupSpent = items.reduce((sum, row) => sum + row.spent, 0);
  const rollupAllocated = items.reduce((sum, row) => sum + row.allocated, 0);

  return buildCategoryRow(
    label,
    label,
    { [label]: rollupSpent },
    { [label]: rollupAllocated },
    totalSpent,
  );
}

export function filterCategoryGroups(
  groups: CategoryGroupRow[],
  totalSpent: number,
  options: { showEmptyBudgets: boolean },
): CategoryGroupRow[] {
  return groups
    .map((group) => {
      const items = group.items.filter((row) =>
        options.showEmptyBudgets
          ? row.spent > 0 || row.allocated > 0
          : row.spent > 0 || row.isOver,
      );

      if (items.length === 0) {
        return null;
      }

      if (group.label && group.rollup) {
        return {
          label: group.label,
          rollup: recalculateRollup(group.label, items, totalSpent),
          items,
        };
      }

      return { ...group, items };
    })
    .filter((group): group is CategoryGroupRow => group !== null);
}

export function countActiveCategories(groups: CategoryGroupRow[]): number {
  return flattenCategoryRows(groups).filter((row) => row.spent > 0).length;
}

export function getOverviewCategoryHighlights(
  categories: BudgetCategory[],
  expenses: CategoryExpense[],
  topCount = 5,
): {
  topSpenders: CategoryRow[];
  overBudget: CategoryRow[];
  totalSpent: number;
  hasLimitsSet: boolean;
} {
  const { groups, totalSpent } = buildGroupedCategoryRows(categories, expenses);
  const allRows = flattenCategoryRows(groups).filter((row) => row.spent > 0);
  const overBudget = sortRowsBySpend(allRows.filter((row) => row.isOver));
  const topSpenders = sortRowsBySpend(allRows).slice(0, topCount);
  const hasLimitsSet = categories.some((category) => category.allocated > 0);

  return {
    topSpenders,
    overBudget,
    totalSpent,
    hasLimitsSet,
  };
}
