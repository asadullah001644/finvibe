import {
  getChildCategoryName,
  buildCategoryGroupsFromNames,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/currency";
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

export interface CategoryRowCaption {
  primary: string;
  isOver: boolean;
  atLimit?: boolean;
}

export function getCategoryBarFillPercent(row: {
  spent: number;
  allocated: number;
  shareOfMonth: number;
}): number {
  if (row.allocated > 0) {
    return Math.min((row.spent / row.allocated) * 100, 100);
  }

  return Math.min(row.shareOfMonth, 100);
}

export function formatCategoryRowCaption(
  row: {
    spent: number;
    allocated: number;
    shareOfMonth: number;
    isOver: boolean;
  },
  totalSpent: number,
): CategoryRowCaption {
  if (row.allocated > 0) {
    if (row.isOver) {
      return {
        primary: `${formatCurrency(row.spent - row.allocated)} over limit`,
        isOver: true,
      };
    }

    const remaining = row.allocated - row.spent;
    if (remaining === 0) {
      return {
        primary: "At limit",
        isOver: false,
        atLimit: true,
      };
    }

    return {
      primary: `${formatCurrency(remaining)} left`,
      isOver: false,
    };
  }

  if (totalSpent <= 0) {
    return {
      primary: formatCurrency(row.spent),
      isOver: false,
    };
  }

  return {
    primary: `${formatCurrency(row.spent)} of ${formatCurrency(totalSpent)} total`,
    isOver: false,
  };
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
  const categoryGroups = buildCategoryGroupsFromNames([...knownNames]);
  const groups: CategoryGroupRow[] = [];
  const generalItems: CategoryRow[] = [];

  for (const group of categoryGroups) {
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

export function getAtOrOverLimitRows(rows: CategoryRow[]): CategoryRow[] {
  return sortRowsBySpend(
    rows.filter(
      (row) =>
        row.isOver ||
        (row.allocated > 0 && row.spent >= row.allocated),
    ),
  );
}

export type CategoryLimitStatus = "over" | "atLimit" | "remaining" | "none";

export function getCategoryLimitStatus(row: CategoryRow): CategoryLimitStatus {
  if (row.allocated <= 0) {
    return "none";
  }

  if (row.isOver) {
    return "over";
  }

  if (row.spent >= row.allocated) {
    return "atLimit";
  }

  return "remaining";
}

export function formatLimitRowAmount(row: CategoryRow): string {
  return `${formatCurrency(row.spent)} / ${formatCurrency(row.allocated)}`;
}

export function formatRemainingLabel(row: CategoryRow): string | null {
  if (getCategoryLimitStatus(row) !== "remaining") {
    return null;
  }

  return `${formatCurrency(row.allocated - row.spent)} left`;
}

export function getOverviewCategoryHighlights(
  categories: BudgetCategory[],
  expenses: CategoryExpense[],
  topCount = 3,
): {
  topSpenders: CategoryRow[];
  atOrOverLimit: CategoryRow[];
  totalSpent: number;
  hasLimitsSet: boolean;
} {
  const { groups, totalSpent } = buildGroupedCategoryRows(categories, expenses);
  const allRows = flattenCategoryRows(groups).filter((row) => row.spent > 0);
  const atOrOverLimit = getAtOrOverLimitRows(allRows);
  const limitNames = new Set(atOrOverLimit.map((row) => row.name));
  const topSpenders = sortRowsBySpend(allRows)
    .filter((row) => !limitNames.has(row.name))
    .slice(0, topCount);
  const hasLimitsSet = categories.some((category) => category.allocated > 0);

  return {
    topSpenders,
    atOrOverLimit,
    totalSpent,
    hasLimitsSet,
  };
}
