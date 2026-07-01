"use client";

import React, { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import type { BudgetCategory } from "@/lib/types";

interface CategoryExpense {
  amount: number;
  category: string;
}

interface CategoryTrackerProps {
  categories: BudgetCategory[];
  expenses: CategoryExpense[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CategoryTracker({
  categories,
  expenses,
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

    return categories.map((category) => {
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
  }, [categories, expenses]);

  const hasAllocations = rows.some((row) => row.allocated > 0);

  if (!hasAllocations) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-cardBorder bg-card/60 p-4 sm:p-5">
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-neonEmerald/80">
          Category Budgets
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Spend vs allocated limits this month
        </p>
      </div>

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
                    {row.isOver && ` — ${formatCurrency(row.spent - row.allocated)} over`}
                  </p>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
