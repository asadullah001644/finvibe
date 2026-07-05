import { loadMonthExpenses } from "@/lib/loadMonthData";
import BurnRateGraph from "@/components/BurnRateGraph";
import AiAudit from "@/components/AiAudit";
import type { MonthBudget } from "@/lib/loadMonthData";

interface InsightsContentLoaderProps {
  monthKey: string;
  budget: MonthBudget;
  isSuperAdmin: boolean;
}

export default async function InsightsContentLoader({
  monthKey,
  budget,
  isSuperAdmin,
}: InsightsContentLoaderProps) {
  const expenses = await loadMonthExpenses(monthKey);

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
    <div className="space-y-6">
      <BurnRateGraph
        monthKey={monthKey}
        salary={budget.totalSalary}
        savingsGoal={budget.savingsGoal}
        expenses={graphExpenses}
      />
      {isSuperAdmin && <AiAudit budget={budget} expenses={auditExpenses} />}
    </div>
  );
}
