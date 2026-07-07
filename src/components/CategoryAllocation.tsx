"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LayoutList, Loader2, Sparkles } from "lucide-react";
import {
  ModalBackdrop,
  ModalFooter,
  ModalHeader,
  getModalMotionProps,
  modalShellClass,
  useIsDesktop,
} from "@/components/ui/modal";
import { useAppNavigation } from "@/components/NavigationLoadingProvider";
import { saveCategoryAllocationsAction } from "@/lib/actions";
import {
  buildCategoryGroupsFromNames,
  distributeCategoryBudgets,
  getChildCategoryName,
} from "@/lib/constants";
import { formatCompactCurrency, formatCurrency } from "@/lib/currency";
import type { BudgetCategory, CategoryGroup } from "@/lib/types";

interface CategoryAllocationProps {
  monthKey: string;
  monthLabel: string;
  totalSalary: number;
  savingsGoal: number;
  categories: BudgetCategory[];
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
  hasLimitsSet?: boolean;
}

const mobileLimitInputClass =
  "h-10 w-[6.5rem] rounded-lg border border-cardBorder/80 bg-background/80 pl-8 pr-2.5 text-right text-sm font-medium tabular-nums text-zinc-100 outline-none transition-colors focus:border-neonEmerald/50 focus:ring-1 focus:ring-neonEmerald/20";

const desktopLimitInputClass =
  "h-10 w-full max-w-[9.5rem] rounded-lg border border-cardBorder/80 bg-background/80 pl-8 pr-3 text-right text-sm font-medium tabular-nums text-zinc-100 outline-none transition-colors focus:border-neonEmerald/50 focus:ring-1 focus:ring-neonEmerald/20";

function LimitInput({
  label,
  allocated,
  onChange,
  variant,
}: {
  label: string;
  allocated: number;
  onChange: (value: string) => void;
  variant: "mobile" | "desktop";
}) {
  return (
    <div className="relative shrink-0">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-zinc-500">
        Rs
      </span>
      <input
        type="number"
        min="0"
        step="1"
        value={allocated || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder="0"
        aria-label={`${label} limit`}
        className={variant === "desktop" ? desktopLimitInputClass : mobileLimitInputClass}
      />
    </div>
  );
}

function MobileLimitRow({
  label,
  allocated,
  onChange,
}: {
  label: string;
  allocated: number;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5">
      <span className="min-w-0 truncate text-sm text-zinc-200">{label}</span>
      <LimitInput
        label={label}
        allocated={allocated}
        onChange={onChange}
        variant="mobile"
      />
    </div>
  );
}

function SummaryStatBox({
  label,
  amount,
  tone = "default",
  compact = false,
}: {
  label: string;
  amount: number;
  tone?: "default" | "emerald" | "crimson";
  compact?: boolean;
}) {
  const amountClass =
    tone === "emerald"
      ? "text-neonEmerald"
      : tone === "crimson"
        ? "text-neonCrimson"
        : "text-zinc-100";

  return (
    <div className="rounded-xl border border-cardBorder/70 bg-background/50 px-3 py-3">
      <p className="text-[11px] leading-snug text-zinc-500">{label}</p>
      <p
        className={`mt-1 font-semibold tabular-nums ${amountClass} ${
          compact ? "text-sm" : "text-base lg:text-lg"
        }`}
      >
        {compact ? formatCompactCurrency(amount) : formatCurrency(amount)}
      </p>
    </div>
  );
}

function AllocationSummaryBar({
  spendable,
  totalAllocated,
  compact = false,
}: {
  spendable: number;
  totalAllocated: number;
  compact?: boolean;
}) {
  const isOver = totalAllocated > spendable;
  const unassigned = Math.max(spendable - totalAllocated, 0);
  const barWidth =
    spendable > 0 ? Math.min((totalAllocated / spendable) * 100, 100) : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-zinc-500">
        <span>
          {formatCurrency(totalAllocated)} in limits
        </span>
        <span>
          {isOver ? (
            <span className="text-neonCrimson">
              {formatCurrency(totalAllocated - spendable)} over budget
            </span>
          ) : (
            <span>{formatCurrency(unassigned)} still free</span>
          )}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-cardBorder/80">
        <div
          className={`h-full rounded-full transition-all ${
            isOver ? "bg-neonCrimson" : "bg-neonEmerald"
          }`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
      {isOver && !compact && (
        <p className="mt-3 text-sm text-neonCrimson">
          Your limits add up to {formatCurrency(totalAllocated)}, which is{" "}
          {formatCurrency(totalAllocated - spendable)} more than your spendable{" "}
          {formatCurrency(spendable)}.
        </p>
      )}
    </div>
  );
}

function MobileAllocationSummary({
  spendable,
  totalAllocated,
  onSuggestSplit,
  isSubmitting,
}: {
  spendable: number;
  totalAllocated: number;
  onSuggestSplit: () => void;
  isSubmitting: boolean;
}) {
  const isOver = totalAllocated > spendable;
  const unassigned = Math.max(spendable - totalAllocated, 0);

  return (
    <div className="rounded-2xl border border-cardBorder/80 bg-background/40 p-4">
      {spendable > 0 ? (
        <>
          <div className="grid grid-cols-3 gap-2">
            <SummaryStatBox
              label="Can spend"
              amount={spendable}
              tone="emerald"
              compact
            />
            <SummaryStatBox
              label="In limits"
              amount={totalAllocated}
              compact
            />
            <SummaryStatBox
              label={isOver ? "Over budget" : "Still free"}
              amount={isOver ? totalAllocated - spendable : unassigned}
              tone={isOver ? "crimson" : "default"}
              compact
            />
          </div>
          <div className="mt-4">
            <AllocationSummaryBar
              spendable={spendable}
              totalAllocated={totalAllocated}
              compact
            />
          </div>
        </>
      ) : (
        <p className="text-sm text-zinc-500">
          Set income first to see how much you can allocate.
        </p>
      )}

      <button
        type="button"
        onClick={onSuggestSplit}
        disabled={spendable <= 0 || isSubmitting}
        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-neonViolet/30 bg-neonViolet/10 px-3 py-2 text-xs font-medium text-neonViolet transition-colors hover:bg-neonViolet/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Sparkles className="h-3.5 w-3.5" />
        Suggest split
      </button>
    </div>
  );
}

function DesktopAllocationSummary({
  spendable,
  totalAllocated,
  onSuggestSplit,
  isSubmitting,
}: {
  spendable: number;
  totalAllocated: number;
  onSuggestSplit: () => void;
  isSubmitting: boolean;
}) {
  const isOver = totalAllocated > spendable;
  const unassigned = Math.max(spendable - totalAllocated, 0);

  return (
    <div className="rounded-2xl border border-cardBorder/80 bg-background/30 p-5">
      {spendable > 0 ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            <SummaryStatBox
              label="You can spend this month"
              amount={spendable}
              tone="emerald"
            />
            <SummaryStatBox label="Set as category limits" amount={totalAllocated} />
            <SummaryStatBox
              label={isOver ? "Over your spendable amount" : "Not assigned to any limit"}
              amount={isOver ? totalAllocated - spendable : unassigned}
              tone={isOver ? "crimson" : "default"}
            />
          </div>

          <div className="mt-5">
            <AllocationSummaryBar
              spendable={spendable}
              totalAllocated={totalAllocated}
            />
          </div>
        </>
      ) : (
        <p className="text-sm text-zinc-500">
          Set your income first to see how much you can allocate to category limits.
        </p>
      )}

      <button
        type="button"
        onClick={onSuggestSplit}
        disabled={spendable <= 0 || isSubmitting}
        className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-neonViolet/30 bg-neonViolet/10 px-4 py-2.5 text-sm font-medium text-neonViolet transition-colors hover:bg-neonViolet/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Sparkles className="h-4 w-4" />
        Suggest split across categories
      </button>
    </div>
  );
}

function getGroupRows(
  group: CategoryGroup,
  categoryRows: BudgetCategory[],
): BudgetCategory[] {
  return group.items
    .map((name) => categoryRows.find((category) => category.name === name))
    .filter((category): category is BudgetCategory => category !== undefined);
}

export default function CategoryAllocation({
  monthKey,
  monthLabel,
  totalSalary,
  savingsGoal,
  categories,
  isOpen: controlledOpen,
  onOpenChange,
  showTrigger = true,
  hasLimitsSet = false,
}: CategoryAllocationProps) {
  const { refresh } = useAppNavigation();
  const [internalOpen, setInternalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isOpen = controlledOpen ?? internalOpen;

  const setOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalOpen(open);
    }
  };

  const [categoryRows, setCategoryRows] = useState<BudgetCategory[]>(categories);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDesktop = useIsDesktop();

  const spendable = Math.max(totalSalary - savingsGoal, 0);

  const categoryGroups = useMemo(
    () => buildCategoryGroupsFromNames(categories.map((category) => category.name)),
    [categories],
  );

  const totalAllocated = useMemo(
    () => categoryRows.reduce((sum, row) => sum + (row.allocated || 0), 0),
    [categoryRows],
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setCategoryRows(categories);
    setError(null);
    setExpandedGroups({});
  }, [categories, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleCategoryChange = (name: string, allocated: string) => {
    setCategoryRows((rows) =>
      rows.map((row) =>
        row.name === name
          ? { ...row, allocated: Number.parseFloat(allocated) || 0 }
          : row,
      ),
    );
  };

  const handleSuggestSplit = () => {
    if (spendable <= 0) {
      setError("Set your income and savings goal first.");
      return;
    }

    setError(null);
    setCategoryRows(distributeCategoryBudgets(categories, spendable));
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((current) => ({
      ...current,
      [groupKey]: !current[groupKey],
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await saveCategoryAllocationsAction({
      monthKey,
      categories: categoryRows,
    });

    if (!result.success) {
      setError(result.error ?? "Could not save category limits. Try again.");
      setIsSubmitting(false);
      return;
    }

    setOpen(false);
    await refresh();
    setIsSubmitting(false);
  };

  const summaryProps = {
    spendable,
    totalAllocated,
    onSuggestSplit: handleSuggestSplit,
    isSubmitting,
  };

  const renderMobileGroups = () => (
    <div className="space-y-2">
      {categoryGroups.map((group) => {
        const groupKey = group.label ?? group.items[0] ?? "misc";
        const groupRows = getGroupRows(group, categoryRows);

        if (groupRows.length === 0) {
          return null;
        }

        const groupAllocated = groupRows.reduce(
          (sum, row) => sum + (row.allocated || 0),
          0,
        );
        const isExpanded = expandedGroups[groupKey] ?? false;
        const hasNestedGroup = Boolean(group.label);

        if (!hasNestedGroup) {
          return (
            <div
              key={groupKey}
              className="overflow-hidden rounded-xl border border-cardBorder/70 bg-background/30"
            >
              {groupRows.map((category, index) => (
                <div
                  key={category.name}
                  className={index > 0 ? "border-t border-cardBorder/50" : ""}
                >
                  <MobileLimitRow
                    label={category.name}
                    allocated={category.allocated}
                    onChange={(value) =>
                      handleCategoryChange(category.name, value)
                    }
                  />
                </div>
              ))}
            </div>
          );
        }

        return (
          <div
            key={groupKey}
            className="overflow-hidden rounded-xl border border-cardBorder/70 bg-background/30"
          >
            <button
              type="button"
              onClick={() => toggleGroup(groupKey)}
              className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition-colors hover:bg-background/50"
            >
              <span className="flex min-w-0 items-center gap-2">
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${
                    isExpanded ? "rotate-0" : "-rotate-90"
                  }`}
                />
                <span className="truncate text-sm font-semibold text-zinc-200">
                  {group.label}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-400">
                {groupAllocated > 0 ? formatCompactCurrency(groupAllocated) : "—"}
              </span>
            </button>

            {isExpanded && (
              <div className="border-t border-cardBorder/50">
                {groupRows.map((category, index) => (
                  <div
                    key={category.name}
                    className={index > 0 ? "border-t border-cardBorder/40" : ""}
                  >
                    <MobileLimitRow
                      label={getChildCategoryName(category.name)}
                      allocated={category.allocated}
                      onChange={(value) =>
                        handleCategoryChange(category.name, value)
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderDesktopTable = () => (
    <div className="overflow-hidden rounded-2xl border border-cardBorder/80">
      <div className="grid grid-cols-[minmax(0,1fr)_10.5rem] items-center gap-6 border-b border-cardBorder/70 bg-background/40 px-5 py-3 text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
        <span>Category</span>
        <span className="text-right">Monthly limit</span>
      </div>

      {categoryGroups.map((group) => {
        const groupKey = group.label ?? group.items[0] ?? "misc";
        const groupRows = getGroupRows(group, categoryRows);

        if (groupRows.length === 0) {
          return null;
        }

        const groupAllocated = groupRows.reduce(
          (sum, row) => sum + (row.allocated || 0),
          0,
        );
        const hasNestedGroup = Boolean(group.label);

        return (
          <div key={groupKey}>
            {hasNestedGroup && (
              <div className="flex items-center justify-between gap-4 border-b border-cardBorder/60 bg-background/25 px-5 py-2.5">
                <span className="text-sm font-semibold text-zinc-300">
                  {group.label}
                </span>
                <span className="text-xs font-medium tabular-nums text-zinc-500">
                  {groupAllocated > 0
                    ? `${formatCompactCurrency(groupAllocated)} total`
                    : "No limits"}
                </span>
              </div>
            )}

            {groupRows.map((category, index) => {
              const label = hasNestedGroup
                ? getChildCategoryName(category.name)
                : category.name;

              return (
                <div
                  key={category.name}
                  className={`grid grid-cols-[minmax(0,1fr)_10.5rem] items-center gap-6 px-5 py-3 transition-colors hover:bg-background/20 ${
                    index < groupRows.length - 1 || hasNestedGroup
                      ? "border-b border-cardBorder/40"
                      : ""
                  }`}
                >
                  <span className="text-sm text-zinc-200">{label}</span>
                  <div className="flex justify-end">
                    <LimitInput
                      label={label}
                      allocated={category.allocated}
                      onChange={(value) =>
                        handleCategoryChange(category.name, value)
                      }
                      variant="desktop"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          <ModalBackdrop
            onClose={() => setOpen(false)}
            label="Close category limits"
            disabled={isSubmitting}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-allocation-title"
            {...getModalMotionProps(isDesktop)}
            className={`${modalShellClass("42rem")} lg:max-h-[min(90vh,800px)]`}
          >
            <ModalHeader
              onClose={() => setOpen(false)}
              closeDisabled={isSubmitting}
              accent="emerald"
            >
              <h2
                id="category-allocation-title"
                className="text-lg font-semibold tracking-tight text-zinc-100 lg:text-xl"
              >
                Category limits
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                {monthLabel} · leave blank for no limit
              </p>
            </ModalHeader>

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 lg:px-6 lg:py-5">
                <div className="lg:hidden">
                  <div className="mb-4">
                    <MobileAllocationSummary {...summaryProps} />
                  </div>
                  {renderMobileGroups()}
                </div>

                <div className="hidden lg:block">
                  <DesktopAllocationSummary {...summaryProps} />
                  <p className="mb-4 mt-5 text-sm text-zinc-500">
                    One row per category. Only fill in the ones you want to cap.
                  </p>
                  {renderDesktopTable()}
                </div>

                {error && (
                  <p className="mt-4 rounded-xl border border-neonCrimson/30 bg-neonCrimson/10 px-3 py-2 text-sm text-neonCrimson">
                    {error}
                  </p>
                )}
              </div>

              <ModalFooter>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <p className="hidden text-sm text-zinc-500 lg:block">
                    {totalAllocated > 0 ? (
                      <>
                        {formatCurrency(totalAllocated)} in limits
                        {spendable > 0 && (
                          <> · {formatCurrency(spendable)} spendable</>
                        )}
                      </>
                    ) : (
                      "No limits set yet."
                    )}
                  </p>

                  <div className="flex gap-3 lg:ml-auto">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      disabled={isSubmitting}
                      className="hidden min-h-11 items-center justify-center rounded-xl border border-cardBorder px-5 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-200 disabled:opacity-60 lg:inline-flex"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-neonEmerald/40 bg-neonEmerald/15 px-5 py-2.5 text-sm font-semibold text-neonEmerald transition-colors hover:bg-neonEmerald/25 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto lg:min-w-[10rem]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving
                        </>
                      ) : (
                        "Save limits"
                      )}
                    </button>
                  </div>
                </div>
              </ModalFooter>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {showTrigger && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative inline-flex min-h-11 items-center gap-2 rounded-xl border border-cardBorder bg-card px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-neonEmerald/40 hover:text-zinc-100 lg:min-h-0 lg:py-2"
        >
          <LayoutList className="h-4 w-4 text-neonEmerald" />
          Categories
          {!hasLimitsSet && (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-neonViolet shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
          )}
        </button>
      )}

      {mounted && createPortal(modal, document.body)}
    </>
  );
}
