"use client";

import React, { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
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
}

export default function CategoryTracker({
  categories,
  expenses,
  onOpenCategories,
}: CategoryTrackerProps) {
  const rows = useMemo(() => {
    const spentByCategory = expenses.reduce<Record<string, number>>(
      (accumulator, expense) => {
        accumulator[expense.category] =
          (accumulator[expense.category] ?? 0) + expense.amount;
        return accumulator;
      },
      {},
    );

    const categoryRows = categories.map((category) => {
      const spent = spentByCategory[category.name] ?? 0;
      const allocated = category.allocated;
      const percent =
        allocated > 0 ? Math.round((spent / allocated) * 100) : null;

      return {
        name: category.name,
        spent,
        allocated,
        percent,
        isOver: allocated > 0 && spent > allocated,
      };
    });

    const extraCategories = Object.entries(spentByCategory)
      .filter(
        ([name, spent]) =>
          spent > 0 && !categories.some((category) => category.name === name),
      )
      .map(([name, spent]) => ({
        name,
        spent,
        allocated: 0,
        percent: null as number | null,
        isOver: false,
      }));

    return [...categoryRows, ...extraCategories].filter(
      (row) => row.spent > 0 || row.allocated > 0,
    );
  }, [categories, expenses]);

  const hasLimitsSet = categories.some((category) => category.allocated > 0);
  const hasAnyActivity = rows.length > 0;

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
          want caps on Kids, Groceries, etc.
        </div>
      )}

      {hasAnyActivity ? (
        <ul className="space-y-4">
          {rows.map((row) => {
            const fillPercent =
              row.allocated > 0
                ? Math.min((row.spent / row.allocated) * 100, 100)
                : 0;

            return (
              <li key={row.name}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-200">
                      {row.name}
                    </span>
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
          })}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500">
          No spending logged yet this month.
        </p>
      )}
    </section>
  );
}
