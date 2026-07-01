"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, LayoutList } from "lucide-react";
import { useState } from "react";
import CategoryBreakdownModal from "@/components/CategoryBreakdownModal";
import { formatCurrency } from "@/lib/currency";
import {
  getOverviewCategoryHighlights,
  type CategoryExpense,
} from "@/lib/categorySpend";
import { buildCategoriesUrl } from "@/lib/navigation";
import type { BudgetCategory } from "@/lib/types";

interface CategorySummaryProps {
  monthKey: string;
  categories: BudgetCategory[];
  expenses: CategoryExpense[];
  onOpenCategories?: () => void;
}

function SummaryRow({
  row,
  monthKey,
  showLimit = false,
}: {
  row: {
    name: string;
    displayName: string;
    spent: number;
    allocated: number;
    isOver: boolean;
    shareOfMonth: number;
  };
  monthKey: string;
  showLimit?: boolean;
}) {
  const fillPercent =
    row.allocated > 0
      ? Math.min((row.spent / row.allocated) * 100, 100)
      : Math.min(row.shareOfMonth, 100);

  return (
    <li>
      <Link
        href={buildCategoriesUrl(monthKey, { category: row.name })}
        className="group block rounded-xl border border-transparent px-2 py-2 transition-colors hover:border-cardBorder hover:bg-background/50"
      >
        <div className="mb-2 flex items-center justify-between gap-3">
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

        <p className="mt-1 text-xs text-zinc-500">
          {row.shareOfMonth}% of month
          {showLimit && row.allocated > 0 && (
            <span className={row.isOver ? " text-neonCrimson" : ""}>
              {" "}
              · {Math.round((row.spent / row.allocated) * 100)}% of limit
            </span>
          )}
        </p>
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
  const router = useRouter();
  const [breakdownOpen, setBreakdownOpen] = useState(false);

  const { topSpenders, overBudget, totalSpent, hasLimitsSet } =
    getOverviewCategoryHighlights(categories, expenses);

  const overBudgetNames = new Set(overBudget.map((row) => row.name));
  const topWithoutDuplicates = topSpenders.filter(
    (row) => !overBudgetNames.has(row.name),
  );

  if (totalSpent === 0 && !onOpenCategories) {
    return null;
  }

  return (
    <>
      <section className="rounded-2xl border border-cardBorder bg-card/60 p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-neonEmerald/80">
              Spending Snapshot
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Top categories this month — tap for details
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setBreakdownOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-cardBorder bg-background/60 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-neonEmerald/30 hover:text-neonEmerald"
            >
              <LayoutList className="h-3.5 w-3.5" />
              Breakdown
            </button>
            <Link
              href={buildCategoriesUrl(monthKey)}
              className="inline-flex items-center gap-1 rounded-lg border border-neonEmerald/30 bg-neonEmerald/10 px-3 py-1.5 text-xs font-medium text-neonEmerald transition-colors hover:bg-neonEmerald/20"
            >
              Browse expenses
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {totalSpent === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-zinc-500">
              No spending logged yet this month.
            </p>
            {onOpenCategories && !hasLimitsSet && (
              <button
                type="button"
                onClick={onOpenCategories}
                className="text-sm font-medium text-neonViolet transition-colors hover:text-neonViolet/80"
              >
                Set category limits (optional)
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {overBudget.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-neonCrimson/90">
                  Over budget
                </p>
                <ul className="space-y-1">
                  {overBudget.map((row) => (
                    <SummaryRow
                      key={row.name}
                      row={row}
                      monthKey={monthKey}
                      showLimit
                    />
                  ))}
                </ul>
              </div>
            )}

            {topWithoutDuplicates.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  {overBudget.length > 0 ? "Also spending most" : "Top spending"}
                </p>
                <ul className="space-y-1">
                  {topWithoutDuplicates.map((row) => (
                    <SummaryRow key={row.name} row={row} monthKey={monthKey} />
                  ))}
                </ul>
              </div>
            )}

            {!hasLimitsSet && onOpenCategories && (
              <button
                type="button"
                onClick={onOpenCategories}
                className="text-sm text-zinc-500 transition-colors hover:text-neonEmerald"
              >
                Optional: set category limits →
              </button>
            )}
          </div>
        )}
      </section>

      <CategoryBreakdownModal
        isOpen={breakdownOpen}
        onClose={() => setBreakdownOpen(false)}
        categories={categories}
        expenses={expenses}
        onOpenCategories={onOpenCategories}
        onCategorySelect={(categoryName) => {
          router.push(buildCategoriesUrl(monthKey, { category: categoryName }));
        }}
      />
    </>
  );
}
