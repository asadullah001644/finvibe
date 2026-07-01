"use client";

import React, { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import {
  getCategoryGroups,
  getChildCategoryName,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/currency";
import type { BudgetCategory } from "@/lib/types";

interface CategoryExpense {
  amount: number;
  category: string;
}

interface CategoryTrackerProps {
  categories: BudgetCategory[];
  expenses: CategoryExpense[];
  onOpenCategories?: () => void;
  onCategorySelect?: (categoryName: string) => void;
}

interface CategoryRow {
  name: string;
  displayName: string;
  spent: number;
  allocated: number;
  percent: number | null;
  isOver: boolean;
  isChild?: boolean;
}

interface CategoryGroupRow {
  label: string | null;
  rollup?: CategoryRow;
  items: CategoryRow[];
}

function buildCategoryRow(
  name: string,
  displayName: string,
  spentByCategory: Record<string, number>,
  allocatedByCategory: Record<string, number>,
  isChild = false,
): CategoryRow {
  const spent = spentByCategory[name] ?? 0;
  const allocated = allocatedByCategory[name] ?? 0;
  const percent = allocated > 0 ? Math.round((spent / allocated) * 100) : null;

  return {
    name,
    displayName,
    spent,
    allocated,
    percent,
    isOver: allocated > 0 && spent > allocated,
    isChild,
  };
}

function CategoryRowItem({
  row,
  onCategorySelect,
}: {
  row: CategoryRow;
  onCategorySelect?: (categoryName: string) => void;
}) {
  const fillPercent =
    row.allocated > 0
      ? Math.min((row.spent / row.allocated) * 100, 100)
      : 0;

  return (
    <li className={row.isChild ? "ml-4 border-l border-cardBorder pl-3" : ""}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {onCategorySelect && row.spent > 0 ? (
            <button
              type="button"
              onClick={() => onCategorySelect(row.name)}
              className="text-left text-sm font-medium text-zinc-200 transition-colors hover:text-neonViolet"
            >
              {row.displayName}
            </button>
          ) : (
            <span className="text-sm font-medium text-zinc-200">
              {row.displayName}
            </span>
          )}
          {row.isOver && (
            <AlertTriangle className="h-3.5 w-3.5 text-neonCrimson" />
          )}
        </div>
        <span
          className={`text-sm font-semibold ${
            row.isOver ? "text-neonCrimson" : "text-zinc-300"
          }`}
        >
          {formatCurrency(row.spent)}
          {row.allocated > 0 && (
            <span className="font-normal text-zinc-500">
              {" "}
              / {formatCurrency(row.allocated)}
            </span>
          )}
        </span>
      </div>

      {row.allocated > 0 && (
        <>
          <div className="h-2 overflow-hidden rounded-full bg-background">
            <div
              className={`h-full rounded-full transition-all ${
                row.isOver ? "bg-neonCrimson" : "bg-neonEmerald"
              }`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
          <p
            className={`mt-1 text-xs ${
              row.isOver ? "text-neonCrimson" : "text-zinc-500"
            }`}
          >
            {row.percent}% used
            {row.isOver &&
              ` — ${formatCurrency(row.spent - row.allocated)} over`}
          </p>
        </>
      )}
    </li>
  );
}

export default function CategoryTracker({
  categories,
  expenses,
  onOpenCategories,
  onCategorySelect,
}: CategoryTrackerProps) {
  const groupedRows = useMemo(() => {
    const spentByCategory = expenses.reduce<Record<string, number>>(
      (accumulator, expense) => {
        accumulator[expense.category] =
          (accumulator[expense.category] ?? 0) + expense.amount;
        return accumulator;
      },
      {},
    );

    const allocatedByCategory = categories.reduce<Record<string, number>>(
      (accumulator, category) => {
        accumulator[category.name] = category.allocated;
        return accumulator;
      },
      {},
    );

    const knownNames = new Set(categories.map((category) => category.name));

    const groups: CategoryGroupRow[] = [];

    for (const group of getCategoryGroups()) {
      const items = group.items
        .map((name) =>
          buildCategoryRow(
            name,
            group.label ? getChildCategoryName(name) : name,
            spentByCategory,
            allocatedByCategory,
            Boolean(group.label),
          ),
        )
        .filter((row) => row.spent > 0 || row.allocated > 0);

      if (items.length === 0) {
        continue;
      }

      if (!group.label) {
        groups.push({ label: null, items });
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
        ),
        items,
      });
    }

    const extraItems = Object.entries(spentByCategory)
      .filter(
        ([name, spent]) => spent > 0 && !knownNames.has(name),
      )
      .map(([name, spent]) => ({
        name,
        displayName: name,
        spent,
        allocated: 0,
        percent: null as number | null,
        isOver: false,
      }));

    if (extraItems.length > 0) {
      groups.push({
        label: "Other categories",
        items: extraItems,
      });
    }

    return groups;
  }, [categories, expenses]);

  const hasLimitsSet = categories.some((category) => category.allocated > 0);
  const hasAnyActivity = groupedRows.length > 0;

  if (!hasAnyActivity && !onOpenCategories) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-cardBorder bg-card/60 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-neonEmerald/80">
            Spending by Category
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            {hasLimitsSet
              ? "Track spend vs your category limits"
              : "See where money goes — limits are optional"}
          </p>
        </div>
        {onOpenCategories && (
          <button
            type="button"
            onClick={onOpenCategories}
            className="rounded-lg border border-neonEmerald/30 bg-neonEmerald/10 px-3 py-1.5 text-xs font-medium text-neonEmerald transition-colors hover:bg-neonEmerald/20"
          >
            {hasLimitsSet ? "Edit limits" : "Set category limits"}
          </button>
        )}
      </div>

      {!hasLimitsSet && onOpenCategories && (
        <div className="mb-4 rounded-xl border border-dashed border-cardBorder bg-background/40 px-4 py-3 text-sm text-zinc-500">
          No category limits yet. Log expenses now, then set limits when you
          want caps on Home, Flat, and other categories.
        </div>
      )}

      {hasAnyActivity ? (
        <div className="space-y-5">
          {groupedRows.map((group) => (
            <div key={group.label ?? group.items[0]?.name ?? "misc"}>
              {group.label && group.rollup && (
                <div className="mb-3 flex items-center justify-between gap-3 border-b border-cardBorder/70 pb-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neonViolet/80">
                    {group.label}
                  </span>
                  <span className="text-sm font-semibold text-zinc-300">
                    {formatCurrency(group.rollup.spent)}
                    {group.rollup.allocated > 0 && (
                      <span className="font-normal text-zinc-500">
                        {" "}
                        / {formatCurrency(group.rollup.allocated)}
                      </span>
                    )}
                  </span>
                </div>
              )}

              <ul className="space-y-4">
                {group.items.map((row) => (
                  <CategoryRowItem
                    key={row.name}
                    row={row}
                    onCategorySelect={onCategorySelect}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          No spending logged yet this month.
        </p>
      )}
    </section>
  );
}
