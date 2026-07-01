"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Cpu, Shield, Wallet } from "lucide-react";
import AiAudit from "@/components/AiAudit";
import AutoLockListener from "@/components/AutoLockListener";
import CategoryAllocation from "@/components/CategoryAllocation";
import BurnRateGraph from "@/components/BurnRateGraph";
import CategoryTracker from "@/components/CategoryTracker";
import HeatmapCalendar from "@/components/HeatmapCalendar";
import IncomeSettings from "@/components/IncomeSettings";
import LockButton from "@/components/LockButton";
import QuickLogFAB from "@/components/QuickLogFAB";
import { computeBudgetMetrics } from "@/lib/budgetMetrics";
import { formatCurrency } from "@/lib/currency";
import type { BudgetCategory } from "@/lib/types";

interface SerializedExpense {
  _id?: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
}

interface DashboardShellProps {
  currentMonthKey: string;
  monthLabel: string;
  budget: {
    monthKey: string;
    totalSalary: number;
    savingsGoal: number;
    categories: BudgetCategory[];
  };
  expenses: SerializedExpense[];
}

function SetupHero({
  monthLabel,
  onSetup,
}: {
  monthLabel: string;
  onSetup: () => void;
}) {
  return (
    <section className="rounded-2xl border border-neonViolet/25 bg-gradient-to-br from-neonViolet/10 via-card/40 to-card/20 p-6 sm:p-8">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-neonViolet/30 bg-neonViolet/10">
          <Wallet className="h-6 w-6 text-neonViolet" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-100">
          Welcome to FinVibe
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          Set your {monthLabel} salary and savings goal — takes 30 seconds.
          Then start logging expenses. Category limits are optional and can
          wait.
        </p>
        <button
          type="button"
          onClick={onSetup}
          className="mt-5 inline-flex items-center justify-center rounded-xl border border-neonViolet/40 bg-neonViolet/15 px-6 py-3 text-sm font-semibold text-neonViolet transition-colors hover:bg-neonViolet/25"
        >
          Set {monthLabel} Income
        </button>
      </div>
    </section>
  );
}

function SummaryStrip({
  salary,
  savingsGoal,
  totalSpent,
}: {
  salary: number;
  savingsGoal: number;
  totalSpent: number;
}) {
  const metrics = computeBudgetMetrics(salary, savingsGoal, totalSpent);

  const standardCards = [
    { label: "Salary", value: metrics.salary, tone: "text-zinc-100" },
    {
      label: "Savings Goal",
      value: metrics.savingsGoal,
      tone: "text-zinc-300",
    },
    {
      label: "Spend Limit",
      value: metrics.spendLimit,
      tone: "text-neonViolet",
    },
    { label: "Spent", value: metrics.totalSpent, tone: "text-neonCrimson" },
  ];

  const spendableTone =
    metrics.spendableRemaining < 0 ? "text-neonCrimson" : "text-neonEmerald";

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {standardCards.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-cardBorder bg-card/60 px-4 py-3"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
            {item.label}
          </p>
          <p className={`mt-1 text-lg font-semibold ${item.tone}`}>
            {formatCurrency(item.value)}
          </p>
        </div>
      ))}

      <div className="rounded-xl border border-neonEmerald/30 bg-neonEmerald/5 px-4 py-3 sm:col-span-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neonEmerald/80">
          Spendable Remaining
        </p>
        <p className={`mt-1 text-2xl font-bold ${spendableTone}`}>
          {formatCurrency(metrics.spendableRemaining)}
        </p>
      </div>

      <div className="rounded-xl border border-cardBorder/60 bg-card/30 px-4 py-3 sm:col-span-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-600">
          Total Account Balance
        </p>
        <p className="mt-0.5 text-[10px] text-zinc-600">(incl. savings)</p>
        <p className="mt-1 text-base font-medium text-zinc-500">
          {formatCurrency(metrics.accountBalance)}
        </p>
      </div>
    </section>
  );
}

export default function DashboardShell({
  currentMonthKey,
  monthLabel,
  budget,
  expenses,
}: DashboardShellProps) {
  const router = useRouter();
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  const handleMonthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (value) {
      router.push(`/?month=${value}`);
    }
  };

  const categoryNames = budget.categories.map((category) => category.name);
  const hasBudgetMetrics = budget.totalSalary > 0 || budget.savingsGoal > 0;
  const hasLimitsSet = budget.categories.some(
    (category) => category.allocated > 0,
  );
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const graphExpenses = expenses.map((expense) => ({
    amount: expense.amount,
    date: expense.date,
  }));

  const auditExpenses = expenses.map((expense) => ({
    amount: expense.amount,
    category: expense.category,
    description: expense.description,
    date: expense.date,
  }));

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#09090B] pb-32 text-zinc-100 selection:bg-[#8B5CF6]/30">
      <AutoLockListener />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.12),transparent_70%)]" />

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
              onOpenChange={setIncomeOpen}
            />
            <CategoryAllocation
              monthKey={currentMonthKey}
              monthLabel={monthLabel}
              totalSalary={budget.totalSalary}
              savingsGoal={budget.savingsGoal}
              categories={budget.categories}
              isOpen={categoriesOpen}
              onOpenChange={setCategoriesOpen}
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

      <div className="relative mx-auto max-w-7xl space-y-6 px-4 py-8">
        {!hasBudgetMetrics ? (
          <SetupHero
            monthLabel={monthLabel}
            onSetup={() => setIncomeOpen(true)}
          />
        ) : (
          <SummaryStrip
            salary={budget.totalSalary}
            savingsGoal={budget.savingsGoal}
            totalSpent={totalSpent}
          />
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section className="space-y-6 xl:col-span-2">
            <BurnRateGraph
              monthKey={currentMonthKey}
              salary={budget.totalSalary}
              savingsGoal={budget.savingsGoal}
              expenses={graphExpenses}
            />

            {hasBudgetMetrics && (
              <CategoryTracker
                categories={budget.categories}
                expenses={auditExpenses}
                onOpenCategories={() => setCategoriesOpen(true)}
              />
            )}

            <HeatmapCalendar
              monthKey={currentMonthKey}
              expenses={expenses}
              categoryNames={categoryNames}
            />
          </section>

          {hasBudgetMetrics && (
            <aside className="xl:col-span-1">
              <div className="xl:sticky xl:top-6">
                <AiAudit budget={budget} expenses={auditExpenses} />
              </div>
            </aside>
          )}
        </div>
      </div>

      <QuickLogFAB customCategories={categoryNames} />
    </main>
  );
}
