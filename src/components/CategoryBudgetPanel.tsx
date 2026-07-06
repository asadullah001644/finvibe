"use client";

import { ChevronDown } from "lucide-react";
import CategoryLimitStatusIcon, {
  limitStatusLabels,
} from "@/components/CategoryLimitStatusIcon";
import {
  buildGroupedCategoryRows,
  countActiveCategories,
  filterCategoryGroups,
  formatCategoryRowCaption,
  formatLimitRowAmount,
  getCategoryBarFillPercent,
  getCategoryLimitStatus,
  type CategoryExpense,
  type CategoryGroupRow,
  type CategoryRow,
} from "@/lib/categorySpend";
import { formatCurrency } from "@/lib/currency";
import type { BudgetCategory } from "@/lib/types";
import { useState } from "react";

interface CategoryBudgetPanelProps {
  categories: BudgetCategory[];
  expenses: CategoryExpense[];
  activeCategoryNames: string[];
  onSelectCategory: (categoryName: string) => void;
  onClearFilter: () => void;
}

function isRowActive(row: CategoryRow, activeCategoryNames: string[]): boolean {
  return activeCategoryNames.includes(row.name);
}

function BudgetRow({
  row,
  totalSpent,
  isActive,
  onSelect,
}: {
  row: CategoryRow;
  totalSpent: number;
  isActive: boolean;
  onSelect: (categoryName: string) => void;
}) {
  const status = getCategoryLimitStatus(row);
  const hasLimit = row.allocated > 0;
  const fillPercent = getCategoryBarFillPercent(row);
  const caption =
    row.spent > 0 ? formatCategoryRowCaption(row, totalSpent) : null;

  if (row.spent <= 0 && row.allocated <= 0) {
    return null;
  }

  return (
    <li className={row.isChild ? "ml-3 border-l border-cardBorder pl-3" : ""}>
      <button
        type="button"
        onClick={() => onSelect(row.name)}
        aria-label={`${row.displayName}, ${formatCurrency(row.spent)} spent${
          hasLimit ? `, ${formatLimitRowAmount(row)}` : ""
        }${status !== "none" ? `, ${limitStatusLabels[status]}` : ""}`}
        aria-pressed={isActive}
        className={`w-full rounded-xl px-2 py-2.5 text-left transition-colors ${
          isActive
            ? "border border-neonViolet/40 bg-neonViolet/10"
            : "border border-transparent hover:border-cardBorder hover:bg-background/50"
        }`}
      >
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {status !== "none" && <CategoryLimitStatusIcon status={status} />}
            <span className="truncate text-sm font-medium text-zinc-200">
              {row.displayName}
            </span>
          </div>
          <span
            className={`shrink-0 text-right text-sm font-semibold tabular-nums ${
              row.isOver ? "text-neonCrimson" : "text-zinc-300"
            }`}
          >
            {formatCurrency(row.spent)}
            {hasLimit && (
              <span className="font-normal text-zinc-500">
                {" "}
                / {formatCurrency(row.allocated)}
              </span>
            )}
          </span>
        </div>

        {(hasLimit || row.spent > 0) && (
          <div className="h-1.5 overflow-hidden rounded-full bg-background">
            <div
              className={`h-full rounded-full transition-all ${
                row.isOver ? "bg-neonCrimson" : "bg-neonEmerald"
              }`}
              style={{ width: `${fillPercent}%` }}
            />
          </div>
        )}

        {caption && (
          <p
            className={`mt-1 text-xs font-medium ${
              caption.isOver
                ? "text-neonCrimson"
                : caption.atLimit
                  ? "text-amber-400/90"
                  : hasLimit
                    ? "text-neonEmerald/90"
                    : "text-zinc-500"
            }`}
          >
            {caption.primary}
          </p>
        )}
      </button>
    </li>
  );
}

function BudgetGroup({
  group,
  totalSpent,
  activeCategoryNames,
  onSelectCategory,
  defaultExpanded,
}: {
  group: CategoryGroupRow;
  totalSpent: number;
  activeCategoryNames: string[];
  onSelectCategory: (categoryName: string) => void;
  defaultExpanded: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasActiveChild = group.items.some((row) =>
    isRowActive(row, activeCategoryNames),
  );

  if (!group.label || !group.rollup) {
    return (
      <ul className="space-y-1">
        {group.items.map((row) => (
          <BudgetRow
            key={row.name}
            row={row}
            totalSpent={totalSpent}
            isActive={isRowActive(row, activeCategoryNames)}
            onSelect={onSelectCategory}
          />
        ))}
      </ul>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className={`mb-2 flex w-full items-center justify-between gap-3 rounded-lg px-1 py-1 text-left transition-colors hover:bg-background/40 ${
          hasActiveChild ? "text-neonViolet" : ""
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${
              expanded ? "rotate-0" : "-rotate-90"
            }`}
          />
          <span className="truncate text-xs font-semibold uppercase tracking-[0.18em] text-neonViolet/80">
            {group.label}
          </span>
        </span>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-300">
          {formatCurrency(group.rollup.spent)}
          {group.rollup.allocated > 0 && (
            <span className="font-normal text-zinc-500">
              {" "}
              / {formatCurrency(group.rollup.allocated)}
            </span>
          )}
        </span>
      </button>

      {expanded && (
        <ul className="space-y-1 pb-2">
          {group.items.map((row) => (
            <BudgetRow
              key={row.name}
              row={row}
              totalSpent={totalSpent}
              isActive={isRowActive(row, activeCategoryNames)}
              onSelect={onSelectCategory}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CategoryBudgetPanel({
  categories,
  expenses,
  activeCategoryNames,
  onSelectCategory,
  onClearFilter,
}: CategoryBudgetPanelProps) {
  const { groups, totalSpent } = buildGroupedCategoryRows(categories, expenses);
  const visibleGroups = filterCategoryGroups(groups, totalSpent, {
    showEmptyBudgets: false,
  });
  const activeCount = countActiveCategories(visibleGroups);
  const hasLimitsSet = categories.some((category) => category.allocated > 0);

  return (
    <section className="rounded-2xl border border-cardBorder bg-card/60 p-4 sm:p-5 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-neonViolet/80">
          Category budgets
        </p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-neonCrimson">
          {formatCurrency(totalSpent)}
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          {activeCount} categor{activeCount === 1 ? "y" : "ies"} with spending
          {hasLimitsSet && " · tap to filter transactions"}
        </p>
      </div>

      {activeCategoryNames.length > 0 && (
        <button
          type="button"
          onClick={onClearFilter}
          className="mb-4 w-full rounded-xl border border-cardBorder bg-background/50 px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-neonViolet/30 hover:text-neonViolet"
        >
          Clear filter · show all transactions
        </button>
      )}

      {visibleGroups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-cardBorder bg-background/40 px-4 py-6 text-center text-sm text-zinc-500">
          No category spending this month yet.
        </p>
      ) : (
        <div className="space-y-4">
          {visibleGroups.map((group) => (
            <BudgetGroup
              key={group.label ?? group.items[0]?.name ?? "misc"}
              group={group}
              totalSpent={totalSpent}
              activeCategoryNames={activeCategoryNames}
              onSelectCategory={onSelectCategory}
              defaultExpanded={
                activeCategoryNames.length === 0 ||
                group.items.some((row) =>
                  isRowActive(row, activeCategoryNames),
                )
              }
            />
          ))}
        </div>
      )}

      {hasLimitsSet && (
        <div className="mt-4 hidden flex-wrap items-center gap-3 border-t border-cardBorder/70 pt-4 text-[10px] text-zinc-600 lg:flex">
          <span className="inline-flex items-center gap-1">
            <CategoryLimitStatusIcon status="remaining" className="h-3 w-3" />
            Budget left
          </span>
          <span className="inline-flex items-center gap-1">
            <CategoryLimitStatusIcon status="atLimit" className="h-3 w-3" />
            Reached
          </span>
          <span className="inline-flex items-center gap-1">
            <CategoryLimitStatusIcon status="over" className="h-3 w-3" />
            Over
          </span>
        </div>
      )}
    </section>
  );
}
