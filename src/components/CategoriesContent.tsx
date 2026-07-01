"use client";

import CategoryExplorer from "@/components/CategoryExplorer";
import CategoryTracker from "@/components/CategoryTracker";
import { useAppShellActions } from "@/components/AppShell";
import type { BudgetCategory } from "@/lib/types";

interface CategoriesContentProps {
  monthKey: string;
  budget: {
    categories: BudgetCategory[];
  };
  expenses: Array<{
    _id?: string;
    amount: number;
    category: string;
    description: string;
    date: Date;
  }>;
}

export default function CategoriesContent({
  monthKey,
  budget,
  expenses,
}: CategoriesContentProps) {
  const { openCategories } = useAppShellActions();
  const categoryNames = budget.categories.map((category) => category.name);

  const auditExpenses = expenses.map((expense) => ({
    amount: expense.amount,
    category: expense.category,
    description: expense.description,
    date: expense.date,
  }));

  return (
    <>
      <CategoryExplorer
        monthKey={monthKey}
        expenses={expenses}
        categoryNames={categoryNames}
      />

      <CategoryTracker
        categories={budget.categories}
        expenses={auditExpenses}
        onOpenCategories={openCategories}
      />
    </>
  );
}
