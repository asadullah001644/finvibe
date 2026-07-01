"use client";

import CategorySummary from "@/components/CategorySummary";
import SetupHero from "@/components/SetupHero";
import SummaryStrip from "@/components/SummaryStrip";
import { useAppShellActions } from "@/components/AppShell";
import type { BudgetCategory } from "@/lib/types";

interface OverviewContentProps {
  monthKey: string;
  monthLabel: string;
  budget: {
    totalSalary: number;
    savingsGoal: number;
    categories: BudgetCategory[];
  };
  expenses: Array<{
    amount: number;
    category: string;
    description: string;
    date: Date;
  }>;
}

export default function OverviewContent({
  monthKey,
  monthLabel,
  budget,
  expenses,
}: OverviewContentProps) {
  const { openIncome, openCategories } = useAppShellActions();

  const hasBudgetMetrics = budget.totalSalary > 0 || budget.savingsGoal > 0;
  const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const auditExpenses = expenses.map((expense) => ({
    amount: expense.amount,
    category: expense.category,
    description: expense.description,
    date: expense.date,
  }));

  return (
    <>
      {!hasBudgetMetrics ? (
        <SetupHero monthLabel={monthLabel} onSetup={openIncome} />
      ) : (
        <SummaryStrip
          salary={budget.totalSalary}
          savingsGoal={budget.savingsGoal}
          totalSpent={totalSpent}
        />
      )}

      {hasBudgetMetrics && (
        <CategorySummary
          monthKey={monthKey}
          categories={budget.categories}
          expenses={auditExpenses}
          onOpenCategories={openCategories}
        />
      )}
    </>
  );
}
