"use client";

import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import CategoryLimitStatusIcon, {
  limitStatusLabels,
} from "@/components/CategoryLimitStatusIcon";
import { useAppShellActions } from "@/components/AppShellProvider";
import { formatCurrency } from "@/lib/currency";
import {
  formatLimitRowAmount,
  formatRemainingLabel,
  getCategoryLimitStatus,
  getOverviewCategoryHighlights,
  type CategoryExpense,
  type CategoryRow,
} from "@/lib/categorySpend";
import { buildCategoriesUrl } from "@/lib/navigation";
import type { BudgetCategory } from "@/lib/types";

interface CategorySummaryProps {
  monthKey: string;
  categories: BudgetCategory[];
  expenses: CategoryExpense[];
  onOpenCategories?: () => void;
}

const rowLinkClass =
  "group flex items-center justify-between gap-3 rounded-xl border border-transparent px-2 py-2.5 transition-colors hover:border-cardBorder hover:bg-background/50";

function LimitRow({ row, monthKey }: { row: CategoryRow; monthKey: string }) {
  const status = getCategoryLimitStatus(row);
  if (status !== "over" && status !== "atLimit") {
    return null;
  }

  return (
    <li>
      <Link
        href={buildCategoriesUrl(monthKey, { category: row.name })}
        className={rowLinkClass}
        aria-label={`${row.displayName}, ${limitStatusLabels[status]}, ${formatLimitRowAmount(row)}`}
      >
        <div className="flex min-w-0 items-center gap-2">
          <CategoryLimitStatusIcon status={status} />
          <span className="truncate text-sm font-medium text-zinc-200 group-hover:text-neonViolet">
            {row.displayName}
          </span>
        </div>
        <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-zinc-300">
          {formatLimitRowAmount(row)}
        </span>
      </Link>
    </li>
  );
}

function TopSpendRow({ row, monthKey }: { row: CategoryRow; monthKey: string }) {
  const status = getCategoryLimitStatus(row);
  const remainingLabel = formatRemainingLabel(row);
  const hasLimit = status === "remaining";

  return (
    <li>
      <Link
        href={buildCategoriesUrl(monthKey, { category: row.name })}
        className={rowLinkClass}
        aria-label={
          remainingLabel
            ? `${row.displayName}, ${formatCurrency(row.spent)}, ${remainingLabel}`
            : `${row.displayName}, ${formatCurrency(row.spent)}`
        }
      >
        <div className="flex min-w-0 items-center gap-2">
          {hasLimit && <CategoryLimitStatusIcon status="remaining" />}
          <span className="truncate text-sm font-medium text-zinc-200 group-hover:text-neonViolet">
            {row.displayName}
          </span>
        </div>
        <div className="shrink-0 text-right">
          <span className="block text-sm font-semibold tabular-nums text-zinc-300">
            {formatCurrency(row.spent)}
          </span>
          {remainingLabel && (
            <span className="mt-0.5 flex items-center justify-end gap-1 text-[11px] font-medium text-neonEmerald/90 sm:text-xs">
              {remainingLabel}
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}

export default function CategorySummary({
  monthKey,
  categories,
  expenses,
  onOpenCategories,
}: CategorySummaryProps) {
  const { openCategories, pendingModalAction } = useAppShellActions();
  const isOpeningCategories = pendingModalAction === "categories";
  const handleOpenCategories = onOpenCategories ?? openCategories;

  const { topSpenders, atOrOverLimit, totalSpent, hasLimitsSet } =
    getOverviewCategoryHighlights(categories, expenses);

  if (totalSpent === 0 && !onOpenCategories) {
    return null;
  }

  return (
    <section className="relative w-full rounded-2xl border border-cardBorder bg-card/60 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-neonEmerald/80">
            This month
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Tap a category for details
          </p>
        </div>
        <Link
          href={buildCategoriesUrl(monthKey)}
          className="inline-flex items-center gap-1 rounded-lg border border-neonEmerald/30 bg-neonEmerald/10 px-3 py-1.5 text-xs font-medium text-neonEmerald transition-colors hover:bg-neonEmerald/20"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {totalSpent === 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-zinc-500">
            No spending logged yet this month.
          </p>
          {handleOpenCategories && !hasLimitsSet && (
            <button
              type="button"
              onClick={handleOpenCategories}
              disabled={isOpeningCategories}
              aria-busy={isOpeningCategories}
              className="inline-flex items-center gap-2 text-sm font-medium text-neonViolet transition-colors hover:text-neonViolet/80 disabled:opacity-70"
            >
              {isOpeningCategories && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              )}
              Set category limits (optional)
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {atOrOverLimit.length > 0 && (
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Category limits
                </p>
                <div className="hidden items-center gap-3 text-[10px] text-zinc-600 sm:flex">
                  <span className="inline-flex items-center gap-1">
                    <CategoryLimitStatusIcon status="atLimit" className="h-3 w-3" />
                    Reached
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CategoryLimitStatusIcon status="over" className="h-3 w-3" />
                    Over
                  </span>
                </div>
              </div>
              <ul className="space-y-0.5">
                {atOrOverLimit.map((row) => (
                  <LimitRow key={row.name} row={row} monthKey={monthKey} />
                ))}
              </ul>
            </div>
          )}

          {topSpenders.length > 0 && (
            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Top spending
                </p>
                {hasLimitsSet && (
                  <span className="hidden items-center gap-1 text-[10px] text-zinc-600 sm:inline-flex">
                    <CategoryLimitStatusIcon status="remaining" className="h-3 w-3" />
                    Has budget left
                  </span>
                )}
              </div>
              <ul className="space-y-0.5">
                {topSpenders.map((row) => (
                  <TopSpendRow key={row.name} row={row} monthKey={monthKey} />
                ))}
              </ul>
            </div>
          )}

          {handleOpenCategories && !hasLimitsSet && (
            <button
              type="button"
              onClick={handleOpenCategories}
              disabled={isOpeningCategories}
              aria-busy={isOpeningCategories}
              className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-neonEmerald disabled:opacity-70"
            >
              {isOpeningCategories && (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              )}
              Optional: set category limits →
            </button>
          )}
        </div>
      )}
    </section>
  );
}
