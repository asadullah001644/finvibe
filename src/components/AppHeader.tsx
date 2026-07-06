"use client";

import { useRef, useState, type RefObject } from "react";
import { Calendar, PanelLeft } from "lucide-react";
import { usePathname } from "next/navigation";
import AppMobileDrawer from "@/components/AppMobileDrawer";
import BudgetToolButtons from "@/components/BudgetToolButtons";
import CategoryAllocation from "@/components/CategoryAllocation";
import IncomeSettings from "@/components/IncomeSettings";
import LockButton from "@/components/LockButton";
import SignOutButton from "@/components/SignOutButton";
import { useAppNavigation } from "@/components/NavigationLoadingProvider";
import { useAppShellActions } from "@/components/AppShellProvider";
import RecurringExpensesSettings from "@/components/RecurringExpensesSettings";
import { APP_TABS, buildMonthUrl, getActiveTabFromPathname } from "@/lib/navigation";
import type { BudgetCategory } from "@/lib/types";

interface AppHeaderProps {
  currentMonthKey: string;
  monthLabel: string;
  carriedFromMonthLabel?: string;
  userDisplayName: string;
  userEmail: string;
  isSuperAdmin: boolean;
  budget: {
    totalSalary: number;
    savingsGoal: number;
    categories: BudgetCategory[];
  };
  hasLimitsSet: boolean;
  incomeOpen: boolean;
  categoriesOpen: boolean;
  recurringOpen: boolean;
  onIncomeOpenChange: (open: boolean) => void;
  onCategoriesOpenChange: (open: boolean) => void;
  onRecurringOpenChange: (open: boolean) => void;
  pinLockEnabled?: boolean;
}

interface MonthPickerProps {
  currentMonthKey: string;
  monthLabel: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onClick: (event: React.MouseEvent<HTMLLabelElement>) => void;
  id?: string;
}

function MonthPicker({
  currentMonthKey,
  monthLabel,
  inputRef,
  onChange,
  onClick,
  id = "app-header-month",
}: MonthPickerProps) {
  return (
    <label
      htmlFor={id}
      onClick={onClick}
      className="relative inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-cardBorder bg-card px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-neonViolet has-[:focus-visible]:border-neonViolet"
    >
      <span className="pointer-events-none select-none">{monthLabel}</span>
      <Calendar className="pointer-events-none h-4 w-4 shrink-0 text-zinc-400" />
      <input
        ref={inputRef}
        id={id}
        name="month"
        type="month"
        value={currentMonthKey}
        onChange={onChange}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 [color-scheme:dark]"
        aria-label={`Select month, currently ${monthLabel}`}
      />
    </label>
  );
}

export default function AppHeader({
  currentMonthKey,
  monthLabel,
  carriedFromMonthLabel,
  userDisplayName,
  userEmail,
  isSuperAdmin,
  budget,
  hasLimitsSet,
  incomeOpen,
  categoriesOpen,
  recurringOpen,
  onIncomeOpenChange,
  onCategoriesOpenChange,
  onRecurringOpenChange,
  pinLockEnabled = false,
}: AppHeaderProps) {
  const { navigate } = useAppNavigation();
  const { openIncome, openCategories, openRecurring, pendingModalAction } =
    useAppShellActions();
  const pathname = usePathname();
  const desktopMonthInputRef = useRef<HTMLInputElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const activeTab = APP_TABS.find((tab) => getActiveTabFromPathname(pathname) === tab.id);
  const pageTitle = activeTab?.label ?? "Overview";

  const handleMonthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value) {
      navigate(buildMonthUrl(pathname, value));
    }
  };

  const handleMonthFieldClick = (
    event: React.MouseEvent<HTMLLabelElement>,
    inputRef: RefObject<HTMLInputElement | null>,
  ) => {
    const input = inputRef.current;
    if (input && typeof input.showPicker === "function") {
      event.preventDefault();
      input.showPicker();
    }
  };

  const openDesktopMonthPicker = (event: React.MouseEvent<HTMLLabelElement>) =>
    handleMonthFieldClick(event, desktopMonthInputRef);

  const budgetModalProps = {
    monthKey: currentMonthKey,
    monthLabel,
    carriedFromMonthLabel,
    budget,
    hasLimitsSet,
    incomeOpen,
    categoriesOpen,
    recurringOpen,
    onIncomeOpenChange,
    onCategoriesOpenChange,
    onRecurringOpenChange,
  };

  return (
    <header className="relative z-10 border-b border-cardBorder/80 bg-background/80 backdrop-blur-xl">
      <IncomeSettings
        monthKey={budgetModalProps.monthKey}
        monthLabel={budgetModalProps.monthLabel}
        totalSalary={budget.totalSalary}
        savingsGoal={budget.savingsGoal}
        carriedFromMonthLabel={carriedFromMonthLabel}
        isOpen={incomeOpen}
        onOpenChange={onIncomeOpenChange}
        showTrigger={false}
      />
      <CategoryAllocation
        monthKey={budgetModalProps.monthKey}
        monthLabel={budgetModalProps.monthLabel}
        totalSalary={budget.totalSalary}
        savingsGoal={budget.savingsGoal}
        categories={budget.categories}
        isOpen={categoriesOpen}
        onOpenChange={onCategoriesOpenChange}
        hasLimitsSet={hasLimitsSet}
        showTrigger={false}
      />
      <RecurringExpensesSettings
        isOpen={recurringOpen}
        onOpenChange={onRecurringOpenChange}
        showTrigger={false}
      />

      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-4 lg:gap-4 lg:px-8 lg:py-5">
        <div className="flex items-center gap-3 lg:hidden">
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cardBorder bg-card text-zinc-300 transition-colors hover:border-neonViolet/40 hover:text-zinc-100"
          >
            <PanelLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-semibold text-zinc-100">{pageTitle}</h1>
            {carriedFromMonthLabel && (
              <p className="mt-0.5 truncate text-xs text-zinc-500">
                Carry-forward from {carriedFromMonthLabel}
              </p>
            )}
          </div>
        </div>

        <div className="hidden flex-col gap-3 lg:flex xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-zinc-100 sm:text-2xl">{pageTitle}</h1>
            {carriedFromMonthLabel && (
              <p className="mt-1 text-xs text-zinc-500">
                Includes carry-forward from {carriedFromMonthLabel}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-cardBorder/70 bg-card/30 p-2 lg:gap-2.5">
            <BudgetToolButtons
              hasLimitsSet={hasLimitsSet}
              loadingAction={pendingModalAction}
              onOpenIncome={openIncome}
              onOpenCategories={openCategories}
              onOpenRecurring={openRecurring}
            />
            <MonthPicker
              id="app-header-month-desktop"
              currentMonthKey={currentMonthKey}
              monthLabel={monthLabel}
              inputRef={desktopMonthInputRef}
              onChange={handleMonthChange}
              onClick={openDesktopMonthPicker}
            />
            {pinLockEnabled && <LockButton compact />}
            <SignOutButton compact />
          </div>
        </div>
      </div>

      <AppMobileDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        currentMonthKey={currentMonthKey}
        monthLabel={monthLabel}
        carriedFromMonthLabel={carriedFromMonthLabel}
        userDisplayName={userDisplayName}
        userEmail={userEmail}
        isSuperAdmin={isSuperAdmin}
        hasLimitsSet={hasLimitsSet}
        pinLockEnabled={pinLockEnabled}
        onOpenIncome={openIncome}
        onOpenCategories={openCategories}
        onOpenRecurring={openRecurring}
        pendingModalAction={pendingModalAction}
        onMonthChange={handleMonthChange}
      />
    </header>
  );
}
