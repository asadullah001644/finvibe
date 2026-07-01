"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import AppBottomNav from "@/components/AppBottomNav";
import AppHeader from "@/components/AppHeader";
import AutoLockListener from "@/components/AutoLockListener";
import CarryForwardNotice from "@/components/CarryForwardNotice";
import QuickLogFAB from "@/components/QuickLogFAB";
import type { AppTab } from "@/lib/navigation";
import type { BudgetCategory } from "@/lib/types";

interface AppShellActions {
  openIncome: () => void;
  openCategories: () => void;
}

const AppShellActionsContext = createContext<AppShellActions | null>(null);

export function useAppShellActions(): AppShellActions {
  const context = useContext(AppShellActionsContext);
  if (!context) {
    throw new Error("useAppShellActions must be used within AppShell");
  }
  return context;
}

interface AppShellProps {
  activeTab: AppTab;
  currentMonthKey: string;
  monthLabel: string;
  carriedFromMonthLabel?: string;
  budget: {
    monthKey: string;
    totalSalary: number;
    savingsGoal: number;
    categories: BudgetCategory[];
  };
  children: ReactNode;
}

export default function AppShell({
  activeTab,
  currentMonthKey,
  monthLabel,
  carriedFromMonthLabel,
  budget,
  children,
}: AppShellProps) {
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);

  const categoryNames = budget.categories.map((category) => category.name);
  const hasLimitsSet = budget.categories.some(
    (category) => category.allocated > 0,
  );

  const shellActions: AppShellActions = {
    openIncome: () => setIncomeOpen(true),
    openCategories: () => setCategoriesOpen(true),
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#09090B] pb-32 text-zinc-100 selection:bg-[#8B5CF6]/30">
      <AutoLockListener />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.12),transparent_70%)]" />

      <AppShellActionsContext.Provider value={shellActions}>
        <AppHeader
        currentMonthKey={currentMonthKey}
        monthLabel={monthLabel}
        carriedFromMonthLabel={carriedFromMonthLabel}
        budget={budget}
        hasLimitsSet={hasLimitsSet}
        incomeOpen={incomeOpen}
        categoriesOpen={categoriesOpen}
        recurringOpen={recurringOpen}
        onIncomeOpenChange={setIncomeOpen}
        onCategoriesOpenChange={setCategoriesOpen}
        onRecurringOpenChange={setRecurringOpen}
      />

      <div className="relative mx-auto max-w-7xl space-y-6 px-4 py-8 pb-24">
        {children}
      </div>

      {carriedFromMonthLabel && (
        <CarryForwardNotice carriedFromMonthLabel={carriedFromMonthLabel} />
      )}
      </AppShellActionsContext.Provider>

      <AppBottomNav activeTab={activeTab} currentMonthKey={currentMonthKey} />
      <QuickLogFAB customCategories={categoryNames} />
    </main>
  );
}
