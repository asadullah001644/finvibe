"use client";

import { LayoutList, Loader2, Wallet } from "lucide-react";
import type { ModalAction } from "@/lib/modalActions";

interface BudgetToolButtonsProps {
  onOpenIncome: () => void;
  onOpenCategories: () => void;
  hasLimitsSet: boolean;
  layout?: "inline" | "drawer";
  loadingAction?: ModalAction | null;
}

export default function BudgetToolButtons({
  onOpenIncome,
  onOpenCategories,
  hasLimitsSet,
  layout = "inline",
  loadingAction = null,
}: BudgetToolButtonsProps) {
  const isDrawer = layout === "drawer";
  const baseClass = isDrawer
    ? "flex w-full min-h-12 items-center gap-3 rounded-xl border border-cardBorder bg-card px-4 text-sm font-medium text-zinc-300 transition-colors disabled:cursor-not-allowed disabled:opacity-70"
    : "inline-flex items-center gap-2 rounded-xl border border-cardBorder bg-card px-4 py-2 text-sm font-medium text-zinc-300 transition-colors disabled:cursor-not-allowed disabled:opacity-70";

  const renderIcon = (action: ModalAction, icon: React.ReactNode) => {
    if (loadingAction === action) {
      return <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />;
    }

    return icon;
  };

  return (
    <>
      <button
        type="button"
        onClick={onOpenIncome}
        disabled={loadingAction === "income"}
        aria-busy={loadingAction === "income"}
        className={`${baseClass} hover:border-neonViolet/40 hover:text-zinc-100`}
      >
        {renderIcon("income", <Wallet className="h-4 w-4 shrink-0 text-neonViolet" />)}
        Income
      </button>
      <button
        type="button"
        onClick={onOpenCategories}
        disabled={loadingAction === "categories"}
        aria-busy={loadingAction === "categories"}
        className={`${baseClass} relative hover:border-neonEmerald/40 hover:text-zinc-100`}
      >
        {renderIcon(
          "categories",
          <LayoutList className="h-4 w-4 shrink-0 text-neonEmerald" />,
        )}
        Category limits
        {!hasLimitsSet && loadingAction !== "categories" && (
          <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-neonViolet shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
        )}
      </button>
    </>
  );
}
