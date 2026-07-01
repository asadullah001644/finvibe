"use client";

import { Cpu, Shield } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import CategoryAllocation from "@/components/CategoryAllocation";
import IncomeSettings from "@/components/IncomeSettings";
import LockButton from "@/components/LockButton";
import { buildMonthUrl } from "@/lib/navigation";
import type { BudgetCategory } from "@/lib/types";

interface AppHeaderProps {
  currentMonthKey: string;
  monthLabel: string;
  budget: {
    totalSalary: number;
    savingsGoal: number;
    categories: BudgetCategory[];
  };
  hasLimitsSet: boolean;
  incomeOpen: boolean;
  categoriesOpen: boolean;
  onIncomeOpenChange: (open: boolean) => void;
  onCategoriesOpenChange: (open: boolean) => void;
}

export default function AppHeader({
  currentMonthKey,
  monthLabel,
  budget,
  hasLimitsSet,
  incomeOpen,
  categoriesOpen,
  onIncomeOpenChange,
  onCategoriesOpenChange,
}: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const handleMonthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value) {
      router.push(buildMonthUrl(pathname, value));
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
          <LockButton />

          <label htmlFor="month" className="sr-only">
            Select month
          </label>
          <input
            id="month"
            name="month"
            type="month"
            value={currentMonthKey}
            onChange={handleMonthChange}
            className="rounded-xl border border-cardBorder bg-card px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-neonViolet [color-scheme:dark]"
          />
        </div>
      </div>
    </header>
  );
}
