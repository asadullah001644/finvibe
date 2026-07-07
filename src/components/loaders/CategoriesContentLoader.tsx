import { listCustomCategories } from "@/actions/dbActions";
import { loadMonthExpenses } from "@/lib/loadMonthData";
import CategoriesContent from "@/components/CategoriesContent";
import type { MonthBudget } from "@/lib/loadMonthData";

interface CategoriesContentLoaderProps {
  monthKey: string;
  budget: MonthBudget;
  isSuperAdmin: boolean;
}

export default async function CategoriesContentLoader({
  monthKey,
  budget,
  isSuperAdmin,
}: CategoriesContentLoaderProps) {
  const [expenses, customCategories] = await Promise.all([
    loadMonthExpenses(monthKey),
    listCustomCategories(),
  ]);

  return (
    <CategoriesContent
      monthKey={monthKey}
      budget={budget}
      expenses={expenses}
      customCategories={customCategories}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
