"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
  type ReactNode,
} from "react";
import AppBottomNav from "@/components/AppBottomNav";
import AppDesktopSidebar from "@/components/AppDesktopSidebar";
import AppHeader from "@/components/AppHeader";
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
  pinLockEnabled?: boolean;
  userDisplayName: string;
  userEmail: string;
  isSuperAdmin: boolean;
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
    current.budget.categories.length !== next.budget.categories.length ||
    current.pinLockEnabled !== next.pinLockEnabled ||
    current.userDisplayName !== next.userDisplayName ||
    current.userEmail !== next.userEmail ||
    current.isSuperAdmin !== next.isSuperAdmin
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
  const clearedRef = useRef(false);

  useLayoutEffect(() => {
    if (clearedRef.current) {
      return;
    }

    clearedRef.current = true;
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
    setMonthData((current) => {
      if (current === null) {
        return current;
      }
      return null;
    });
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
  const shellReady = monthData !== null;

  return (
    <AppShellControlContext.Provider value={controlValue}>
      <AppShellActionsContext.Provider value={actions}>
        <div
          className={`relative min-h-screen overflow-x-hidden bg-[#09090B] text-zinc-100 selection:bg-[#8B5CF6]/30 ${
            shellReady ? "pb-32 lg:flex lg:pb-0" : ""
          }`}
        >
          {shellReady && (
            <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.12),transparent_70%)]" />
          )}

          {shellReady && monthData && (
            <Suspense fallback={null}>
              <AppDesktopSidebar
                userDisplayName={monthData.userDisplayName}
                userEmail={monthData.userEmail}
                isSuperAdmin={monthData.isSuperAdmin}
              />
            </Suspense>
          )}

          <div className={`relative min-w-0 ${shellReady ? "flex-1" : ""}`}>
            {shellReady && monthData && (
              <AppHeader
                currentMonthKey={monthData.monthKey}
                monthLabel={monthData.monthLabel}
                carriedFromMonthLabel={monthData.carriedFromMonthLabel}
                userDisplayName={monthData.userDisplayName}
                userEmail={monthData.userEmail}
                budget={monthData.budget}
                hasLimitsSet={hasLimitsSet}
                incomeOpen={incomeOpen}
                categoriesOpen={categoriesOpen}
                recurringOpen={recurringOpen}
                onIncomeOpenChange={setIncomeOpen}
                onCategoriesOpenChange={setCategoriesOpen}
                onRecurringOpenChange={setRecurringOpen}
                pinLockEnabled={monthData.pinLockEnabled ?? false}
              />
            )}

            <div
              className={
                shellReady
                  ? "relative mx-auto max-w-[1600px] space-y-6 px-4 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-10"
                  : undefined
              }
            >
              <AppShellContent>{children}</AppShellContent>
            </div>

            {shellReady && monthData?.carriedFromMonthLabel && (
              <CarryForwardNotice
                carriedFromMonthLabel={monthData.carriedFromMonthLabel}
              />
            )}

            {shellReady && monthData && (
              <QuickLogFAB customCategories={categoryNames}>
                <div className="lg:hidden">
                  <AppBottomNav />
                </div>
              </QuickLogFAB>
            )}
          </div>
        </div>
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
  pinLockEnabled = false,
  userDisplayName,
  userEmail,
  isSuperAdmin,
  children,
}: MonthDataSyncProps) {
  const control = useContext(AppShellControlContext);
  const { markContentReady } = useAppNavigation();
  const syncedKeyRef = useRef<string | null>(null);

  const categoriesKey = budget.categories
    .map((category) => `${category.name}:${category.allocated}`)
    .join("|");

  const syncKey = [
    activeTab,
    monthKey,
    monthLabel,
    carriedFromMonthLabel ?? "",
    budget.monthKey,
    budget.totalSalary,
    budget.savingsGoal,
    categoriesKey,
    pinLockEnabled,
    userDisplayName,
    userEmail,
    isSuperAdmin,
  ].join("|");

  useLayoutEffect(() => {
    if (syncedKeyRef.current === syncKey) {
      return;
    }

    syncedKeyRef.current = syncKey;
    control?.syncMonthData({
      activeTab,
      monthKey,
      monthLabel,
      carriedFromMonthLabel,
      budget,
      pinLockEnabled,
      userDisplayName,
      userEmail,
      isSuperAdmin,
    });
    markContentReady();
  }, [control, syncKey, activeTab, monthKey, monthLabel, carriedFromMonthLabel, budget, pinLockEnabled, userDisplayName, userEmail, isSuperAdmin, markContentReady]);

  return children;
}
