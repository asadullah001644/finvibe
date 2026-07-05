import { loadMonthExpenses } from "@/lib/loadMonthData";
import HeatmapCalendar from "@/components/HeatmapCalendar";
import type { MonthBudget } from "@/lib/loadMonthData";

interface CalendarContentLoaderProps {
  monthKey: string;
  budget: MonthBudget;
}

export default async function CalendarContentLoader({
  monthKey,
  budget,
}: CalendarContentLoaderProps) {
  const expenses = await loadMonthExpenses(monthKey);
  const categoryNames = budget.categories.map((category) => category.name);

  return (
    <HeatmapCalendar
      monthKey={monthKey}
      expenses={expenses}
      categoryNames={categoryNames}
    />
  );
}
