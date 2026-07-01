"use client";

import { useState } from "react";
import { Cpu, Shield, Wallet } from "lucide-react";
import AiAudit from "@/components/AiAudit";
import AutoLockListener from "@/components/AutoLockListener";
import BudgetSettings from "@/components/BudgetSettings";
import BurnRateGraph from "@/components/BurnRateGraph";
import CategoryTracker from "@/components/CategoryTracker";
import HeatmapCalendar from "@/components/HeatmapCalendar";
import LockButton from "@/components/LockButton";
import QuickLogFAB from "@/components/QuickLogFAB";
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
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
          Set up your {monthLabel} budget first — salary, savings goal, and
          category limits — then start logging expenses to see your burn rate
          and heatmap.
        </p>
        <button
          type="button"
          onClick={onSetup}
          className="mt-5 inline-flex items-center justify-center rounded-xl border border-neonViolet/40 bg-neonViolet/15 px-6 py-3 text-sm font-semibold text-neonViolet transition-colors hover:bg-neonViolet/25"
        >
          Set Up {monthLabel} Budget
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
  const remaining = salary - totalSpent;
  const spendable = salary - savingsGoal;

  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        { label: "Salary", value: salary, tone: "text-zinc-100" },
        { label: "Spent", value: totalSpent, tone: "text-neonCrimson" },
        { label: "Remaining", value: remaining, tone: "text-neonEmerald" },
        { label: "Spend Limit", value: spendable, tone: "text-neonViolet" },
      ].map((item) => (
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
    </section>
  );
}

export default function DashboardShell({
  currentMonthKey,
  monthLabel,
  budget,
  expenses,
}: DashboardShellProps) {
  const [budgetOpen, setBudgetOpen] = useState(false);

  const categoryNames = budget.categories.map((category) => category.name);
  const hasBudgetMetrics = budget.totalSalary > 0 || budget.savingsGoal > 0;
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
            <BudgetSettings
              monthKey={currentMonthKey}
              monthLabel={monthLabel}
              totalSalary={budget.totalSalary}
              savingsGoal={budget.savingsGoal}
              categories={budget.categories}
              isOpen={budgetOpen}
              onOpenChange={setBudgetOpen}
            />
            <LockButton />

            <form action="/" method="get" className="flex items-center gap-2">
              <label htmlFor="month" className="sr-only">
                Select month
              </label>
              <input
                id="month"
                name="month"
                type="month"
                defaultValue={currentMonthKey}
                className="rounded-xl border border-cardBorder bg-card px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-neonViolet [color-scheme:dark]"
              />
              <button
                type="submit"
                className="rounded-xl border border-neonViolet/30 bg-neonViolet/10 px-4 py-2 text-sm font-medium text-neonViolet transition-colors hover:bg-neonViolet/20"
              >
                Go
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-7xl space-y-6 px-4 py-8">
        {!hasBudgetMetrics ? (
          <SetupHero
            monthLabel={monthLabel}
            onSetup={() => setBudgetOpen(true)}
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
