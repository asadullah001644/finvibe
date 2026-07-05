import { loadMonthExpenses } from "@/lib/loadMonthData";
import OverviewContent from "@/components/OverviewContent";
import type { MonthBudget } from "@/lib/loadMonthData";

interface OverviewContentLoaderProps {
  monthKey: string;
  monthLabel: string;
  budget: MonthBudget;
}

export default async function OverviewContentLoader({
  monthKey,
  monthLabel,
  budget,
}: OverviewContentLoaderProps) {
  const expenses = await loadMonthExpenses(monthKey);

  return (
    <OverviewContent
      monthKey={monthKey}
      monthLabel={monthLabel}
      budget={budget}
      expenses={expenses}
    />
  );
}
