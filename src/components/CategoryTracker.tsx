"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import {
  buildGroupedCategoryRows,
  type CategoryExpense,
  type CategoryRow,
} from "@/lib/categorySpend";
import { formatCurrency } from "@/lib/currency";
import type { BudgetCategory } from "@/lib/types";

interface CategoryTrackerProps {
  categories: BudgetCategory[];
  expenses: CategoryExpense[];
  onOpenCategories?: () => void;
  onCategorySelect?: (categoryName: string) => void;
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

      {row.allocated > 0 ? (
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
            {row.percent}% of limit · {row.shareOfMonth}% of month
            {row.isOver &&
              ` · ${formatCurrency(row.spent - row.allocated)} over`}
          </p>
        </>
      ) : (
        row.spent > 0 && (
          <p className="text-xs text-zinc-500">
            {row.shareOfMonth}% of month · no limit set
          </p>
        )
      )}
    </li>
  );
}

function CollapsibleGroup({
  label,
  rollupSpent,
  rollupAllocated,
  defaultExpanded,
  children,
}: {
  label: string;
  rollupSpent: number;
  rollupAllocated: number;
  defaultExpanded: boolean;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="mb-3 flex w-full items-center justify-between gap-3 border-b border-cardBorder/70 pb-2 text-left"
      >
        <span className="flex items-center gap-2">
          <ChevronDown
            className={`h-4 w-4 text-zinc-500 transition-transform ${
              expanded ? "rotate-0" : "-rotate-90"
            }`}
          />
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neonViolet/80">
            {label}
          </span>
        </span>
        <span className="text-sm font-semibold text-zinc-300">
          {formatCurrency(rollupSpent)}
          {rollupAllocated > 0 && (
            <span className="font-normal text-zinc-500">
              {" "}
              / {formatCurrency(rollupAllocated)}
            </span>
          )}
        </span>
      </button>

      {expanded && children}
    </div>
  );
}

export default function CategoryTracker({
  categories,
  expenses,
  onOpenCategories,
  onCategorySelect,
}: CategoryTrackerProps) {
  const { groups: groupedRows, totalSpent } = useMemo(
    () => buildGroupedCategoryRows(categories, expenses),
    [categories, expenses],
  );

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
              ? "Full breakdown vs your category limits"
              : "Full breakdown — limits are optional"}
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
          {groupedRows.map((group) => {
            const groupKey = group.label ?? group.items[0]?.name ?? "misc";
            const list = (
              <ul className="space-y-4">
                {group.items.map((row) => (
                  <CategoryRowItem
                    key={row.name}
                    row={row}
                    onCategorySelect={onCategorySelect}
                  />
                ))}
              </ul>
            );

            if (group.label && group.rollup) {
              return (
                <CollapsibleGroup
                  key={groupKey}
                  label={group.label}
                  rollupSpent={group.rollup.spent}
                  rollupAllocated={group.rollup.allocated}
                  defaultExpanded={group.rollup.isOver || group.rollup.spent > 0}
                >
                  {list}
                </CollapsibleGroup>
              );
            }

            return <div key={groupKey}>{list}</div>;
          })}

          {totalSpent > 0 && (
            <p className="border-t border-cardBorder pt-3 text-xs text-zinc-500">
              Month total: {formatCurrency(totalSpent)} across{" "}
              {groupedRows.reduce((count, group) => count + group.items.length, 0)}{" "}
              active categories
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          No spending logged yet this month.
        </p>
      )}
    </section>
  );
}
