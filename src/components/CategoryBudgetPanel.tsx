"use client";

import { ChevronDown, Settings2 } from "lucide-react";
import ManageCategoriesModal from "@/components/ManageCategoriesModal";
import CategoryLimitStatusIcon, {
  limitStatusLabels,
} from "@/components/CategoryLimitStatusIcon";
import {
  buildGroupedCategoryRows,
  countActiveCategories,
  filterCategoryGroups,
  getCategoryLimitStatus,
  type CategoryExpense,
  type CategoryGroupRow,
  type CategoryRow,
} from "@/lib/categorySpend";
import { formatCompactCurrency, formatCurrency } from "@/lib/currency";
import type { BudgetCategory } from "@/lib/types";
import type { CustomCategoryRecord } from "@/lib/customCategories";
import { useEffect, useState } from "react";

interface CategoryBudgetPanelProps {
  categories: BudgetCategory[];
  expenses: CategoryExpense[];
  activeCategoryNames: string[];
  customCategories: CustomCategoryRecord[];
  isSuperAdmin: boolean;
  onSelectCategory: (categoryName: string) => void;
  compact?: boolean;
}

function isRowActive(row: CategoryRow, activeCategoryNames: string[]): boolean {
  return activeCategoryNames.includes(row.name);
}

function BudgetRow({
  row,
  isActive,
  onSelect,
  compact = false,
}: {
  row: CategoryRow;
  isActive: boolean;
  onSelect: (categoryName: string) => void;
  compact?: boolean;
}) {
  const status = getCategoryLimitStatus(row);
  const hasLimit = row.allocated > 0;

  if (row.spent <= 0 && row.allocated <= 0) {
    return null;
  }

  const amountLabel = compact
    ? formatCompactCurrency(row.spent)
    : formatCurrency(row.spent);

  return (
    <li className={row.isChild && !compact ? "ml-2 border-l border-cardBorder/80 pl-3" : ""}>
      <button
        type="button"
        onClick={() => onSelect(row.name)}
        aria-label={`${row.displayName}, ${formatCurrency(row.spent)} spent${
          status !== "none" ? `, ${limitStatusLabels[status]}` : ""
        }`}
        aria-pressed={isActive}
        className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 text-left transition-colors ${
          compact ? "py-2.5" : "py-3"
        } ${
          isActive
            ? "bg-neonViolet/15 ring-1 ring-neonViolet/35"
            : "hover:bg-background/60"
        }`}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {status !== "none" && (
            <CategoryLimitStatusIcon status={status} className="h-4 w-4" />
          )}
          <span className="truncate text-sm font-medium text-zinc-100">
            {row.displayName}
          </span>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold tabular-nums text-zinc-200">
            {amountLabel}
          </p>
          {hasLimit && (
            <p className="text-[11px] tabular-nums text-zinc-500">
              of {compact ? formatCompactCurrency(row.allocated) : formatCurrency(row.allocated)}
            </p>
          )}
        </div>
      </button>
    </li>
  );
}

function BudgetGroup({
  group,
  activeCategoryNames,
  onSelectCategory,
  compact = false,
}: {
  group: CategoryGroupRow;
  activeCategoryNames: string[];
  onSelectCategory: (categoryName: string) => void;
  compact?: boolean;
}) {
  const hasActiveChild = group.items.some((row) =>
    isRowActive(row, activeCategoryNames),
  );
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (hasActiveChild) {
      setExpanded(true);
    }
  }, [hasActiveChild]);

  if (!group.label || !group.rollup) {
    return (
      <ul className="space-y-0.5">
        {group.items.map((row) => (
          <BudgetRow
            key={row.name}
            row={row}
            isActive={isRowActive(row, activeCategoryNames)}
            onSelect={onSelectCategory}
            compact={compact}
          />
        ))}
      </ul>
    );
  }

  return (
    <div className="rounded-xl border border-cardBorder/60 bg-background/30">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-background/50 ${
          hasActiveChild ? "text-neonViolet" : ""
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${
              expanded ? "rotate-0" : "-rotate-90"
            }`}
          />
          <span className="truncate text-sm font-semibold text-zinc-200">
            {group.label}
          </span>
        </span>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-300">
          {formatCurrency(group.rollup.spent)}
        </span>
      </button>

      {expanded && (
        <ul className="space-y-0.5 border-t border-cardBorder/50 px-1 pb-1 pt-0.5">
          {group.items.map((row) => (
            <BudgetRow
              key={row.name}
              row={row}
              isActive={isRowActive(row, activeCategoryNames)}
              onSelect={onSelectCategory}
              compact={compact}
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
  customCategories,
  isSuperAdmin,
  onSelectCategory,
  compact = false,
}: CategoryBudgetPanelProps) {
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false);
  const { groups, totalSpent } = buildGroupedCategoryRows(categories, expenses);
  const visibleGroups = filterCategoryGroups(groups, totalSpent, {
    showEmptyBudgets: false,
  });
  const activeCount = countActiveCategories(visibleGroups);

  return (
    <>
      {isSuperAdmin && (
        <ManageCategoriesModal
          isOpen={manageCategoriesOpen}
          onClose={() => setManageCategoriesOpen(false)}
          customCategories={customCategories}
        />
      )}

      {(isSuperAdmin || !compact) && (
        <div
          className={`flex items-center gap-3 ${compact ? "mb-2 justify-end" : "mb-3 justify-between"}`}
        >
          {!compact && (
            <p className="text-sm text-zinc-500">
              {activeCount} active categor{activeCount === 1 ? "y" : "ies"}
            </p>
          )}
          {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setManageCategoriesOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neonViolet/25 bg-neonViolet/10 px-2.5 py-1.5 text-xs font-medium text-neonViolet transition-colors hover:bg-neonViolet/20"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Manage
          </button>
        )}
        </div>
      )}

      {visibleGroups.length === 0 ? (
        <p className="rounded-xl border border-dashed border-cardBorder bg-background/40 px-4 py-8 text-center text-sm text-zinc-500">
          No spending by category yet this month.
        </p>
      ) : (
        <div className="space-y-2">
          {visibleGroups.map((group) => (
            <BudgetGroup
              key={group.label ?? group.items[0]?.name ?? "misc"}
              group={group}
              activeCategoryNames={activeCategoryNames}
              onSelectCategory={onSelectCategory}
              compact={compact}
            />
          ))}
        </div>
      )}
    </>
  );
}
