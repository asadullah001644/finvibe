"use client";

import CategoryExplorer from "@/components/CategoryExplorer";
import type { CustomCategoryRecord } from "@/lib/customCategories";
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
  customCategories: CustomCategoryRecord[];
  isSuperAdmin: boolean;
}

export default function CategoriesContent({
  monthKey,
  budget,
  expenses,
  customCategories,
  isSuperAdmin,
}: CategoriesContentProps) {
  return (
    <CategoryExplorer
      monthKey={monthKey}
      expenses={expenses}
      categories={budget.categories}
      customCategories={customCategories}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
