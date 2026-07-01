import AiAudit from "@/components/AiAudit";
import AppShell from "@/components/AppShell";
import BurnRateGraph from "@/components/BurnRateGraph";
import {
  AuthGate,
  getAuthenticatedMonthPageData,
} from "@/lib/pageHelpers";

interface InsightsPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function InsightsPage({ searchParams }: InsightsPageProps) {
  const pageData = await getAuthenticatedMonthPageData(searchParams);

  if (pageData.locked) {
    return <AuthGate locked>{null}</AuthGate>;
  }

  const { monthKey, monthLabel, budget, expenses } = pageData;

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

  const hasBudgetMetrics = budget.totalSalary > 0 || budget.savingsGoal > 0;

  return (
    <AuthGate locked={false}>
      <AppShell
        activeTab="insights"
        currentMonthKey={monthKey}
        monthLabel={monthLabel}
        budget={budget}
      >
        {hasBudgetMetrics ? (
          <div className="space-y-6">
            <BurnRateGraph
              monthKey={monthKey}
              salary={budget.totalSalary}
              savingsGoal={budget.savingsGoal}
              expenses={graphExpenses}
            />
            <AiAudit budget={budget} expenses={auditExpenses} />
          </div>
        ) : (
          <section className="rounded-2xl border border-dashed border-cardBorder bg-card/40 px-6 py-10 text-center">
            <p className="text-sm text-zinc-400">
              Set your income on the Overview page to unlock burn-rate telemetry
              and AI capital audits.
            </p>
          </section>
        )}
      </AppShell>
    </AuthGate>
  );
}
