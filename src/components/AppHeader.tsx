"use client";

import { useRef, type RefObject } from "react";
import Link from "next/link";
import { Calendar, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import CategoryAllocation from "@/components/CategoryAllocation";
import IncomeSettings from "@/components/IncomeSettings";
import LockButton from "@/components/LockButton";
import SignOutButton from "@/components/SignOutButton";
import { useAppNavigation } from "@/components/NavigationLoadingProvider";
import RecurringExpensesSettings from "@/components/RecurringExpensesSettings";
import { APP_TABS, buildMonthUrl, getActiveTabFromPathname } from "@/lib/navigation";
import { resolveDisplayInitial } from "@/lib/profileDisplay";
import type { BudgetCategory } from "@/lib/types";

interface AppHeaderProps {
  currentMonthKey: string;
  monthLabel: string;
  carriedFromMonthLabel?: string;
  userDisplayName: string;
  userEmail: string;
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
  compact?: boolean;
  id?: string;
}

function MonthPicker({
  currentMonthKey,
  monthLabel,
  inputRef,
  onChange,
  onClick,
  compact = false,
  id = "app-header-month",
}: MonthPickerProps) {
  return (
    <label
      htmlFor={id}
      onClick={onClick}
      className={`relative inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-cardBorder bg-card text-zinc-200 transition-colors hover:border-neonViolet has-[:focus-visible]:border-neonViolet ${
        compact ? "px-2.5 py-2 text-xs" : "gap-2 px-3 py-2 text-sm"
      }`}
    >
      <span className="pointer-events-none max-w-[7.5rem] truncate select-none sm:max-w-none">
        {monthLabel}
      </span>
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

function BudgetTools({
  currentMonthKey,
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
  pinLockEnabled,
  showMonthPicker,
  monthPickerId,
  monthInputRef,
  onMonthChange,
  onMonthFieldClick,
  compactLock = false,
  showSignOut = true,
}: {
  currentMonthKey: string;
  monthLabel: string;
  carriedFromMonthLabel?: string;
  budget: AppHeaderProps["budget"];
  hasLimitsSet: boolean;
  incomeOpen: boolean;
  categoriesOpen: boolean;
  recurringOpen: boolean;
  onIncomeOpenChange: (open: boolean) => void;
  onCategoriesOpenChange: (open: boolean) => void;
  onRecurringOpenChange: (open: boolean) => void;
  pinLockEnabled: boolean;
  showMonthPicker: boolean;
  monthPickerId: string;
  monthInputRef: RefObject<HTMLInputElement | null>;
  onMonthChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onMonthFieldClick: (event: React.MouseEvent<HTMLLabelElement>) => void;
  compactLock?: boolean;
  showSignOut?: boolean;
}) {
  return (
    <>
      <IncomeSettings
        monthKey={currentMonthKey}
        monthLabel={monthLabel}
        totalSalary={budget.totalSalary}
        savingsGoal={budget.savingsGoal}
        carriedFromMonthLabel={carriedFromMonthLabel}
        isOpen={incomeOpen}
        onOpenChange={onIncomeOpenChange}
      />
      <CategoryAllocation
        monthKey={currentMonthKey}
        monthLabel={monthLabel}
        totalSalary={budget.totalSalary}
        savingsGoal={budget.savingsGoal}
        categories={budget.categories}
        isOpen={categoriesOpen}
        onOpenChange={onCategoriesOpenChange}
        hasLimitsSet={hasLimitsSet}
      />
      <RecurringExpensesSettings
        isOpen={recurringOpen}
        onOpenChange={onRecurringOpenChange}
      />
      {showMonthPicker && (
        <MonthPicker
          id={monthPickerId}
          currentMonthKey={currentMonthKey}
          monthLabel={monthLabel}
          inputRef={monthInputRef}
          onChange={onMonthChange}
          onClick={onMonthFieldClick}
        />
      )}
      {pinLockEnabled && <LockButton compact={compactLock} />}
      {showSignOut && <SignOutButton compact={compactLock} />}
    </>
  );
}

export default function AppHeader({
  currentMonthKey,
  monthLabel,
  carriedFromMonthLabel,
  userDisplayName,
  userEmail,
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
  const pathname = usePathname();
  const mobileMonthInputRef = useRef<HTMLInputElement>(null);
  const desktopMonthInputRef = useRef<HTMLInputElement>(null);
  const activeTab = APP_TABS.find((tab) => getActiveTabFromPathname(pathname) === tab.id);
  const pageTitle = activeTab?.label ?? "Overview";
  const initial = resolveDisplayInitial(userDisplayName);

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

  const budgetToolsProps = {
    currentMonthKey,
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
    pinLockEnabled,
    onMonthChange: handleMonthChange,
  };

  const openMobileMonthPicker = (event: React.MouseEvent<HTMLLabelElement>) =>
    handleMonthFieldClick(event, mobileMonthInputRef);

  const openDesktopMonthPicker = (event: React.MouseEvent<HTMLLabelElement>) =>
    handleMonthFieldClick(event, desktopMonthInputRef);

  return (
    <header className="relative z-10 border-b border-cardBorder/80 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3 px-4 py-4 lg:gap-4 lg:px-8 lg:py-5">
        <div className="flex items-center justify-between gap-3 lg:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neonViolet/30 bg-neonViolet/10 text-xs font-semibold text-neonViolet">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-zinc-100">{userDisplayName}</p>
              <p className="truncate text-xs text-zinc-500">{userEmail}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <MonthPicker
              id="app-header-month-mobile"
              currentMonthKey={currentMonthKey}
              monthLabel={monthLabel}
              inputRef={mobileMonthInputRef}
              onChange={handleMonthChange}
              onClick={openMobileMonthPicker}
              compact
            />
            <Link
              href="/settings"
              prefetch
              className="inline-flex items-center justify-center rounded-xl border border-cardBorder bg-card p-2 text-zinc-300 transition-colors hover:border-neonViolet/40 hover:text-zinc-100"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <SignOutButton compact />
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-zinc-100 sm:text-2xl">{pageTitle}</h1>
            {carriedFromMonthLabel && (
              <p className="mt-1 text-xs text-zinc-500">
                Includes carry-forward from {carriedFromMonthLabel}
              </p>
            )}
          </div>

          <div className="hidden flex-wrap items-center gap-2 rounded-2xl border border-cardBorder/70 bg-card/30 p-2 lg:flex lg:gap-2.5">
            <BudgetTools
              {...budgetToolsProps}
              showMonthPicker
              monthPickerId="app-header-month-desktop"
              monthInputRef={desktopMonthInputRef}
              onMonthFieldClick={openDesktopMonthPicker}
            />
          </div>
        </div>

        <div className="-mx-4 flex flex-nowrap items-center gap-2 overflow-x-auto px-4 pb-0.5 lg:hidden [&>*]:shrink-0">
          <BudgetTools
            {...budgetToolsProps}
            showMonthPicker={false}
            monthPickerId="app-header-month-mobile"
            monthInputRef={mobileMonthInputRef}
            onMonthFieldClick={openMobileMonthPicker}
            compactLock
            showSignOut={false}
          />
        </div>
      </div>
    </header>
  );
}
