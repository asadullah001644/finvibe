import { loadMonthExpenses } from "@/lib/loadMonthData";
import CategoriesContent from "@/components/CategoriesContent";
import type { MonthBudget } from "@/lib/loadMonthData";

interface CategoriesContentLoaderProps {
  monthKey: string;
  budget: MonthBudget;
}

export default async function CategoriesContentLoader({
  monthKey,
  budget,
}: CategoriesContentLoaderProps) {
  const expenses = await loadMonthExpenses(monthKey);

  return (
    <CategoriesContent monthKey={monthKey} budget={budget} expenses={expenses} />
  );
}
