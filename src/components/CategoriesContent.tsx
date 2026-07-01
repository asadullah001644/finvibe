"use client";

import { useRouter } from "next/navigation";
import CategoryExplorer from "@/components/CategoryExplorer";
import CategorySpendingSnapshot from "@/components/CategorySpendingSnapshot";
import { useAppShellActions } from "@/components/AppShell";
import { buildCategoriesUrl } from "@/lib/navigation";
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
  const router = useRouter();
  const { openCategories } = useAppShellActions();
  const categoryNames = budget.categories.map((category) => category.name);

  const auditExpenses = expenses.map((expense) => ({
    amount: expense.amount,
    category: expense.category,
    description: expense.description,
    date: expense.date,
  }));

  return (
    <div className="space-y-4">
      <CategorySpendingSnapshot
        categories={budget.categories}
        expenses={auditExpenses}
        onOpenCategories={openCategories}
        onCategorySelect={(categoryName) => {
          router.push(buildCategoriesUrl(monthKey, { category: categoryName }));
        }}
      />

      <CategoryExplorer
        monthKey={monthKey}
        expenses={expenses}
        categoryNames={categoryNames}
      />
    </div>
  );
}
