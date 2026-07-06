"use client";

import { LayoutList, Repeat, Wallet } from "lucide-react";

interface BudgetToolButtonsProps {
  onOpenIncome: () => void;
  onOpenCategories: () => void;
  onOpenRecurring: () => void;
  hasLimitsSet: boolean;
  layout?: "inline" | "drawer";
}

export default function BudgetToolButtons({
  onOpenIncome,
  onOpenCategories,
  onOpenRecurring,
  hasLimitsSet,
  layout = "inline",
}: BudgetToolButtonsProps) {
  const isDrawer = layout === "drawer";
  const baseClass = isDrawer
    ? "flex w-full min-h-12 items-center gap-3 rounded-xl border border-cardBorder bg-card px-4 text-sm font-medium text-zinc-300 transition-colors"
    : "inline-flex items-center gap-2 rounded-xl border border-cardBorder bg-card px-4 py-2 text-sm font-medium text-zinc-300 transition-colors";

  return (
    <>
      <button
        type="button"
        onClick={onOpenIncome}
        className={`${baseClass} hover:border-neonViolet/40 hover:text-zinc-100`}
      >
        <Wallet className="h-4 w-4 shrink-0 text-neonViolet" />
        Income
      </button>
      <button
        type="button"
        onClick={onOpenCategories}
        className={`${baseClass} relative hover:border-neonEmerald/40 hover:text-zinc-100`}
      >
        <LayoutList className="h-4 w-4 shrink-0 text-neonEmerald" />
        Categories
        {!hasLimitsSet && (
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-neonViolet shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
        )}
      </button>
      <button
        type="button"
        onClick={onOpenRecurring}
        className={`${baseClass} hover:border-neonViolet/40 hover:text-zinc-100`}
      >
        <Repeat className="h-4 w-4 shrink-0 text-neonViolet" />
        Recurring
      </button>
    </>
  );
}
