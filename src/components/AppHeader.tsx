"use client";

import { useRef } from "react";
import Link from "next/link";
import { Calendar, Cpu, Settings, Shield } from "lucide-react";
import { usePathname } from "next/navigation";
import CategoryAllocation from "@/components/CategoryAllocation";
import IncomeSettings from "@/components/IncomeSettings";
import LockButton from "@/components/LockButton";
import { useAppNavigation } from "@/components/NavigationLoadingProvider";
import RecurringExpensesSettings from "@/components/RecurringExpensesSettings";
import { buildMonthUrl } from "@/lib/navigation";
import type { BudgetCategory } from "@/lib/types";

interface AppHeaderProps {
  currentMonthKey: string;
  monthLabel: string;
  carriedFromMonthLabel?: string;
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

export default function AppHeader({
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
  pinLockEnabled = false,
}: AppHeaderProps) {
  const { navigate } = useAppNavigation();
  const pathname = usePathname();
  const monthInputRef = useRef<HTMLInputElement>(null);

  const handleMonthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value) {
      navigate(buildMonthUrl(pathname, value));
    }
  };

  const handleMonthFieldClick = (
    event: React.MouseEvent<HTMLLabelElement>,
  ) => {
    const input = monthInputRef.current;
    if (input && typeof input.showPicker === "function") {
      event.preventDefault();
      input.showPicker();
    }
  };

  return (
    <header className="relative z-10 border-b border-cardBorder/80 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-neonViolet" />
            <h1 className="text-lg font-semibold tracking-[0.08em] text-zinc-100 sm:text-xl">
              FinVibe
            </h1>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-neonEmerald/30 bg-neonEmerald/10 px-3 py-1 text-xs font-medium text-neonEmerald">
              <Cpu className="h-3.5 w-3.5" />
              {monthLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
          <Link
            href="/settings"
            prefetch
            className="inline-flex items-center justify-center rounded-xl border border-cardBorder bg-card p-2 text-zinc-300 transition-colors hover:border-neonViolet/40 hover:text-zinc-100"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </Link>
          {pinLockEnabled && <LockButton />}

          <label
            htmlFor="month"
            onClick={handleMonthFieldClick}
            className="relative inline-flex cursor-pointer items-center gap-2 rounded-xl border border-cardBorder bg-card px-3 py-2 text-sm text-zinc-200 transition-colors hover:border-neonViolet has-[:focus-visible]:border-neonViolet"
          >
            <span className="pointer-events-none select-none">{monthLabel}</span>
            <Calendar className="pointer-events-none h-4 w-4 shrink-0 text-zinc-400" />
            <input
              ref={monthInputRef}
              id="month"
              name="month"
              type="month"
              value={currentMonthKey}
              onChange={handleMonthChange}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 [color-scheme:dark]"
              aria-label={`Select month, currently ${monthLabel}`}
            />
          </label>
        </div>
      </div>
    </header>
  );
}
