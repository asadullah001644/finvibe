"use client";

import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAppShellActions } from "@/components/AppShellProvider";
import { formatCurrency } from "@/lib/currency";
import {
  formatLimitRowAmount,
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
  return (
    <li>
      <Link
        href={buildCategoriesUrl(monthKey, { category: row.name })}
        className={rowLinkClass}
      >
        <span className="truncate text-sm font-medium text-zinc-200 group-hover:text-neonViolet">
          {row.displayName}
        </span>
        <span className="shrink-0 text-right text-sm font-semibold text-zinc-300">
          {formatLimitRowAmount(row)}
        </span>
      </Link>
    </li>
  );
}

function TopSpendRow({ row, monthKey }: { row: CategoryRow; monthKey: string }) {
  return (
    <li>
      <Link
        href={buildCategoriesUrl(monthKey, { category: row.name })}
        className={rowLinkClass}
      >
        <span className="truncate text-sm font-medium text-zinc-200 group-hover:text-neonViolet">
          {row.displayName}
        </span>
        <span className="shrink-0 text-sm font-semibold text-zinc-300">
          {formatCurrency(row.spent)}
        </span>
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
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Category limits
              </p>
              <ul className="space-y-0.5">
                {atOrOverLimit.map((row) => (
                  <LimitRow key={row.name} row={row} monthKey={monthKey} />
                ))}
              </ul>
            </div>
          )}

          {topSpenders.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Top spending
              </p>
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
