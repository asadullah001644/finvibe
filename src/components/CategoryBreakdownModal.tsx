"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ChevronDown } from "lucide-react";
import {
  ModalBackdrop,
  ModalHeader,
  getModalMotionProps,
  modalShellClass,
  useIsDesktop,
} from "@/components/ui/modal";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  buildGroupedCategoryRows,
  countActiveCategories,
  filterCategoryGroups,
  formatCategoryRowCaption,
  getCategoryBarFillPercent,
  type CategoryExpense,
  type CategoryGroupRow,
  type CategoryRow,
  type CategoryRowCaption,
} from "@/lib/categorySpend";
import { formatCurrency } from "@/lib/currency";
import type { BudgetCategory } from "@/lib/types";

interface CategoryBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: BudgetCategory[];
  expenses: CategoryExpense[];
  onOpenCategories?: () => void;
  onCategorySelect?: (categoryName: string) => void;
}

function rowSubtext(row: CategoryRow): CategoryRowCaption | null {
  if (row.spent <= 0) {
    return null;
  }

  return formatCategoryRowCaption(row);
}

function BreakdownRow({
  row,
  onCategorySelect,
}: {
  row: CategoryRow;
  onCategorySelect?: (categoryName: string) => void;
}) {
  const fillPercent = getCategoryBarFillPercent(row);
  const caption = rowSubtext(row);

  return (
    <li className={row.isChild ? "ml-3 border-l border-cardBorder pl-3" : ""}>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {onCategorySelect && row.spent > 0 ? (
            <button
              type="button"
              onClick={() => onCategorySelect(row.name)}
              className="truncate text-left text-sm font-medium text-zinc-200 transition-colors hover:text-neonViolet"
            >
              {row.displayName}
            </button>
          ) : (
            <span className="truncate text-sm font-medium text-zinc-200">
              {row.displayName}
            </span>
          )}
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
          {row.allocated > 0 && (
            <span className="font-normal text-zinc-500">
              {" "}
              / {formatCurrency(row.allocated)}
            </span>
          )}
        </span>
      </div>

      {(row.allocated > 0 || row.spent > 0) && (
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
        <p className="mt-1 text-sm">
          <span
            className={
              caption.isOver ? "font-medium text-neonCrimson" : "text-zinc-400"
            }
          >
            {caption.primary}
          </span>
          {caption.secondary && (
            <span className="text-zinc-500"> · {caption.secondary}</span>
          )}
        </p>
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
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="mb-2 flex w-full items-center justify-between gap-3 border-b border-cardBorder/70 pb-2 text-left"
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

function BreakdownList({
  groups,
  totalSpent,
  onCategorySelect,
}: {
  groups: CategoryGroupRow[];
  totalSpent: number;
  onCategorySelect?: (categoryName: string) => void;
}) {
  if (groups.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-zinc-500">
        No active spending for this view. Turn on empty budgets to see limits
        with no spend yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => {
        const groupKey = group.label ?? group.items[0]?.name ?? "misc";
        const list = (
          <ul className="space-y-3">
            {group.items.map((row) => (
              <BreakdownRow
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
              defaultExpanded={group.rollup.spent > 0 || group.rollup.isOver}
            >
              {list}
            </CollapsibleGroup>
          );
        }

        return <div key={groupKey}>{list}</div>;
      })}

      {totalSpent > 0 && (
        <p className="border-t border-cardBorder pt-3 text-sm text-zinc-400">
          Month total: {formatCurrency(totalSpent)} ·{" "}
          {countActiveCategories(groups)} active
        </p>
      )}
    </div>
  );
}

export default function CategoryBreakdownModal({
  isOpen,
  onClose,
  categories,
  expenses,
  onOpenCategories,
  onCategorySelect,
}: CategoryBreakdownModalProps) {
  const [mounted, setMounted] = useState(false);
  const [showEmptyBudgets, setShowEmptyBudgets] = useState(false);
  const isDesktop = useIsDesktop();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const { groups: allGroups, totalSpent } = useMemo(
    () => buildGroupedCategoryRows(categories, expenses),
    [categories, expenses],
  );

  const visibleGroups = useMemo(
    () =>
      filterCategoryGroups(allGroups, totalSpent, { showEmptyBudgets }),
    [allGroups, totalSpent, showEmptyBudgets],
  );

  const hasLimitsSet = categories.some((category) => category.allocated > 0);

  const handleCategorySelect = (categoryName: string) => {
    onCategorySelect?.(categoryName);
    onClose();
  };

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          <ModalBackdrop
            onClose={onClose}
            label="Close category breakdown"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-breakdown-title"
            {...getModalMotionProps(isDesktop)}
            className={`${modalShellClass()} lg:shadow-[0_0_60px_rgba(16,185,129,0.15)]`}
          >
            <ModalHeader onClose={onClose} accent="emerald">
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-neonEmerald/80">
                All categories
              </p>
              <h2
                id="category-breakdown-title"
                className="mt-2 text-lg font-semibold text-zinc-100"
              >
                Spending breakdown
              </h2>
              {totalSpent > 0 && (
                <p className="mt-1 text-sm text-zinc-400">
                  {formatCurrency(totalSpent)} this month
                </p>
              )}
            </ModalHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-zinc-400">
                  <input
                    type="checkbox"
                    checked={showEmptyBudgets}
                    onChange={(event) =>
                      setShowEmptyBudgets(event.target.checked)
                    }
                    className="h-4 w-4 rounded border-cardBorder bg-background accent-neonEmerald"
                  />
                  Show empty budgets
                </label>
                {onOpenCategories && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenCategories();
                      onClose();
                    }}
                    className="rounded-lg border border-neonEmerald/30 bg-neonEmerald/10 px-3 py-1.5 text-xs font-medium text-neonEmerald transition-colors hover:bg-neonEmerald/20"
                  >
                    {hasLimitsSet ? "Edit limits" : "Set limits"}
                  </button>
                )}
              </div>

              <BreakdownList
                groups={visibleGroups}
                totalSpent={totalSpent}
                onCategorySelect={handleCategorySelect}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) {
    return null;
  }

  return createPortal(modal, document.body);
}
