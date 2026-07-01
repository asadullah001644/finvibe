"use client";

import CategoryExplorer from "@/components/CategoryExplorer";
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
  const categoryNames = budget.categories.map((category) => category.name);

  return (
    <CategoryExplorer
      monthKey={monthKey}
      expenses={expenses}
      categoryNames={categoryNames}
    />
  );
}
