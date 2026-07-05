"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import AppBottomNav from "@/components/AppBottomNav";
import AppHeader from "@/components/AppHeader";
import AutoLockListener from "@/components/AutoLockListener";
import CarryForwardNotice from "@/components/CarryForwardNotice";
import ContentLoadingOverlay from "@/components/ContentLoadingOverlay";
import ContentSubtleRefresh from "@/components/ContentSubtleRefresh";
import QuickLogFAB from "@/components/QuickLogFAB";
import { useAppNavigation } from "@/components/NavigationLoadingProvider";
import type { AppTab } from "@/lib/navigation";
import type { BudgetCategory } from "@/lib/types";

interface AppShellBudget {
  monthKey: string;
  totalSalary: number;
  savingsGoal: number;
  categories: BudgetCategory[];
}

export interface AppShellMonthData {
  activeTab: AppTab;
  monthKey: string;
  monthLabel: string;
  carriedFromMonthLabel?: string;
  budget: AppShellBudget;
}

interface AppShellActions {
  openIncome: () => void;
  openCategories: () => void;
}

interface AppShellControlContextValue {
  syncMonthData: (data: AppShellMonthData) => void;
  clearMonthData: () => void;
}

const AppShellControlContext =
  createContext<AppShellControlContextValue | null>(null);
const AppShellActionsContext = createContext<AppShellActions | null>(null);

export function useAppShellActions(): AppShellActions {
  const context = useContext(AppShellActionsContext);
  if (!context) {
    throw new Error("useAppShellActions must be used within AppShellProvider");
  }
  return context;
}

function monthDataEquals(
  current: AppShellMonthData,
  next: AppShellMonthData,
): boolean {
  if (
    current.activeTab !== next.activeTab ||
    current.monthKey !== next.monthKey ||
    current.monthLabel !== next.monthLabel ||
    current.carriedFromMonthLabel !== next.carriedFromMonthLabel ||
    current.budget.monthKey !== next.budget.monthKey ||
    current.budget.totalSalary !== next.budget.totalSalary ||
    current.budget.savingsGoal !== next.budget.savingsGoal ||
    current.budget.categories.length !== next.budget.categories.length
  ) {
    return false;
  }

  return current.budget.categories.every(
    (category, index) =>
      category.name === next.budget.categories[index]?.name &&
      category.allocated === next.budget.categories[index]?.allocated,
  );
}

export function ClearAppShell() {
  const control = useContext(AppShellControlContext);

  useLayoutEffect(() => {
    control?.clearMonthData();
  }, [control]);

  return null;
}

function AppShellContent({ children }: { children: ReactNode }) {
  const { isNavigating } = useAppNavigation();

  return (
    <div className="relative min-h-[calc(100vh-12rem)]">
      <ContentLoadingOverlay />
      <div
        aria-hidden={isNavigating}
        className={isNavigating ? "invisible" : undefined}
      >
        <ContentSubtleRefresh>{children}</ContentSubtleRefresh>
      </div>
    </div>
  );
}

export default function AppShellProvider({ children }: { children: ReactNode }) {
  const [monthData, setMonthData] = useState<AppShellMonthData | null>(null);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);

  const syncMonthData = useCallback((data: AppShellMonthData) => {
    setMonthData((current) => {
      if (current && monthDataEquals(current, data)) {
        return current;
      }
      return data;
    });
  }, []);

  const clearMonthData = useCallback(() => {
    setMonthData(null);
    setIncomeOpen(false);
    setCategoriesOpen(false);
    setRecurringOpen(false);
  }, []);

  const controlValue = useMemo(
    () => ({ syncMonthData, clearMonthData }),
    [syncMonthData, clearMonthData],
  );

  const actions = useMemo<AppShellActions>(
    () => ({
      openIncome: () => setIncomeOpen(true),
      openCategories: () => setCategoriesOpen(true),
    }),
    [],
  );

  const categoryNames =
    monthData?.budget.categories.map((category) => category.name) ?? [];
  const hasLimitsSet =
    monthData?.budget.categories.some((category) => category.allocated > 0) ??
    false;

  if (!monthData) {
    return (
      <AppShellControlContext.Provider value={controlValue}>
        <AppShellActionsContext.Provider value={actions}>
          <AutoLockListener />
          {children}
        </AppShellActionsContext.Provider>
      </AppShellControlContext.Provider>
    );
  }

  return (
    <AppShellControlContext.Provider value={controlValue}>
      <AppShellActionsContext.Provider value={actions}>
        <main className="relative min-h-screen overflow-x-hidden bg-[#09090B] pb-32 text-zinc-100 selection:bg-[#8B5CF6]/30">
          <AutoLockListener />

          <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.12),transparent_70%)]" />

          <AppHeader
            currentMonthKey={monthData.monthKey}
            monthLabel={monthData.monthLabel}
            carriedFromMonthLabel={monthData.carriedFromMonthLabel}
            budget={monthData.budget}
            hasLimitsSet={hasLimitsSet}
            incomeOpen={incomeOpen}
            categoriesOpen={categoriesOpen}
            recurringOpen={recurringOpen}
            onIncomeOpenChange={setIncomeOpen}
            onCategoriesOpenChange={setCategoriesOpen}
            onRecurringOpenChange={setRecurringOpen}
          />

          <div className="relative mx-auto max-w-7xl space-y-6 px-4 py-8 pb-24">
            <AppShellContent>{children}</AppShellContent>
          </div>

          {monthData.carriedFromMonthLabel && (
            <CarryForwardNotice
              carriedFromMonthLabel={monthData.carriedFromMonthLabel}
            />
          )}

          <QuickLogFAB customCategories={categoryNames}>
            <AppBottomNav />
          </QuickLogFAB>
        </main>
      </AppShellActionsContext.Provider>
    </AppShellControlContext.Provider>
  );
}

interface MonthDataSyncProps extends Omit<AppShellMonthData, "activeTab"> {
  activeTab: AppTab;
  children: ReactNode;
}

export function MonthDataSync({
  activeTab,
  monthKey,
  monthLabel,
  carriedFromMonthLabel,
  budget,
  children,
}: MonthDataSyncProps) {
  const control = useContext(AppShellControlContext);

  const categoriesKey = budget.categories
    .map((category) => `${category.name}:${category.allocated}`)
    .join("|");

  useLayoutEffect(() => {
    control?.syncMonthData({
      activeTab,
      monthKey,
      monthLabel,
      carriedFromMonthLabel,
      budget,
    });
  }, [
    control,
    activeTab,
    monthKey,
    monthLabel,
    carriedFromMonthLabel,
    budget.totalSalary,
    budget.savingsGoal,
    budget.monthKey,
    categoriesKey,
    // budget is intentionally omitted — categoriesKey + salary fields cover changes
  ]);

  return children;
}
