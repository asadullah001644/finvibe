"use client";

import { AlertTriangle, LayoutList } from "lucide-react";
import { useMemo, useState } from "react";
import CategoryBreakdownModal from "@/components/CategoryBreakdownModal";
import {
  buildGroupedCategoryRows,
  countActiveCategories,
  getOverviewCategoryHighlights,
  type CategoryExpense,
} from "@/lib/categorySpend";
import { formatCurrency } from "@/lib/currency";
import type { BudgetCategory } from "@/lib/types";

interface CategorySpendingSnapshotProps {
  categories: BudgetCategory[];
  expenses: CategoryExpense[];
  onOpenCategories?: () => void;
  onCategorySelect?: (categoryName: string) => void;
}

function SnapshotRow({
  row,
  showLimit = false,
  onSelect,
}: {
  row: {
    name: string;
    displayName: string;
    spent: number;
    allocated: number;
    isOver: boolean;
    shareOfMonth: number;
    percent: number | null;
  };
  showLimit?: boolean;
  onSelect?: (categoryName: string) => void;
}) {
  const fillPercent =
    row.allocated > 0
      ? Math.min((row.spent / row.allocated) * 100, 100)
      : Math.min(row.shareOfMonth, 100);

  const subtext =
    showLimit && row.allocated > 0
      ? `${row.percent}% of limit`
      : `${row.shareOfMonth}% of month`;

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect?.(row.name)}
        className="group w-full rounded-xl border border-transparent px-2 py-2 text-left transition-colors hover:border-cardBorder hover:bg-background/50"
      >
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-sm font-medium text-zinc-200 group-hover:text-neonViolet">
              {row.displayName}
            </span>
            {row.isOver && (
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-neonCrimson" />
            )}
          </div>
          <span
            className={`shrink-0 text-sm font-semibold ${
              row.isOver ? "text-neonCrimson" : "text-zinc-300"
            }`}
          >
            {formatCurrency(row.spent)}
          </span>
        </div>

        <div className="h-1.5 overflow-hidden rounded-full bg-background">
          <div
            className={`h-full rounded-full transition-all ${
              row.isOver ? "bg-neonCrimson" : "bg-neonEmerald"
            }`}
            style={{ width: `${fillPercent}%` }}
          />
        </div>

        <p
          className={`mt-1 text-sm ${
            row.isOver ? "text-neonCrimson/90" : "text-zinc-400"
          }`}
        >
          {subtext}
        </p>
      </button>
    </li>
  );
}

export default function CategorySpendingSnapshot({
  categories,
  expenses,
  onOpenCategories,
  onCategorySelect,
}: CategorySpendingSnapshotProps) {
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  const { topSpenders, overBudget, totalSpent, hasLimitsSet } =
    getOverviewCategoryHighlights(categories, expenses, 4);

  const totalActiveCategories = useMemo(() => {
    const { groups } = buildGroupedCategoryRows(categories, expenses);
    return countActiveCategories(groups);
  }, [categories, expenses]);

  const overBudgetNames = new Set(overBudget.map((row) => row.name));
  const topWithoutDuplicates = topSpenders.filter(
    (row) => !overBudgetNames.has(row.name),
  );

  const shownCount = useMemo(() => {
    const names = new Set([
      ...overBudget.map((row) => row.name),
      ...topWithoutDuplicates.map((row) => row.name),
    ]);
    return names.size;
  }, [overBudget, topWithoutDuplicates]);

  const hiddenCount = Math.max(0, totalActiveCategories - shownCount);

  if (totalSpent === 0 && !onOpenCategories) {
    return null;
  }

  return (
    <>
      <section className="rounded-2xl border border-cardBorder bg-card/60 p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-neonEmerald/80">
              Spending
            </p>
            {totalSpent > 0 ? (
              <p className="mt-1 text-sm text-zinc-300">
                <span className="font-semibold text-zinc-100">
                  {formatCurrency(totalSpent)}
                </span>{" "}
                this month
                {totalActiveCategories > 0 && (
                  <span className="text-zinc-500">
                    {" "}
                    · {totalActiveCategories} active
                  </span>
                )}
              </p>
            ) : (
              <p className="mt-1 text-sm text-zinc-500">
                No spending logged yet
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {onOpenCategories && (
              <button
                type="button"
                onClick={onOpenCategories}
                className="rounded-lg border border-cardBorder bg-background/60 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-neonEmerald/30 hover:text-neonEmerald"
              >
                {hasLimitsSet ? "Edit limits" : "Set limits"}
              </button>
            )}
            <button
              type="button"
              onClick={() => setBreakdownOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neonEmerald/30 bg-neonEmerald/10 px-3 py-1.5 text-xs font-medium text-neonEmerald transition-colors hover:bg-neonEmerald/20"
            >
              <LayoutList className="h-3.5 w-3.5" />
              View all
            </button>
          </div>
        </div>

        {totalSpent > 0 ? (
          <div className="space-y-4">
            {overBudget.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-neonCrimson/90">
                  Over budget
                </p>
                <ul className="space-y-0.5">
                  {overBudget.map((row) => (
                    <SnapshotRow
                      key={row.name}
                      row={row}
                      showLimit
                      onSelect={onCategorySelect}
                    />
                  ))}
                </ul>
              </div>
            )}

            {topWithoutDuplicates.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {overBudget.length > 0 ? "Also spending most" : "Top spending"}
                </p>
                <ul className="space-y-0.5">
                  {topWithoutDuplicates.map((row) => (
                    <SnapshotRow
                      key={row.name}
                      row={row}
                      onSelect={onCategorySelect}
                    />
                  ))}
                </ul>
              </div>
            )}

            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setBreakdownOpen(true)}
                className="text-sm text-zinc-500 transition-colors hover:text-neonEmerald"
              >
                +{hiddenCount} more in full breakdown →
              </button>
            )}
          </div>
        ) : (
          onOpenCategories &&
          !hasLimitsSet && (
            <button
              type="button"
              onClick={onOpenCategories}
              className="text-sm font-medium text-neonViolet transition-colors hover:text-neonViolet/80"
            >
              Set category limits (optional)
            </button>
          )
        )}
      </section>

      <CategoryBreakdownModal
        isOpen={breakdownOpen}
        onClose={() => setBreakdownOpen(false)}
        categories={categories}
        expenses={expenses}
        onOpenCategories={onOpenCategories}
        onCategorySelect={onCategorySelect}
      />
    </>
  );
}
