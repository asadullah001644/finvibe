import { MonthDataSync } from "@/components/AppShellProvider";
import ExpenseContentSuspense from "@/components/ExpenseContentSuspense";
import InsightsContentLoader from "@/components/loaders/InsightsContentLoader";
import NavigationContentReady from "@/components/NavigationContentReady";
import {
  AuthGate,
  getAuthenticatedShellData,
} from "@/lib/pageHelpers";

interface InsightsPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function InsightsPage({ searchParams }: InsightsPageProps) {
  const shellData = await getAuthenticatedShellData(searchParams);

  if (shellData.locked) {
    return <AuthGate locked>{null}</AuthGate>;
  }

  const { monthKey, monthLabel, budget, carriedFromMonthLabel } = shellData;
  const hasBudgetMetrics = budget.totalSalary > 0 || budget.savingsGoal > 0;

  return (
    <AuthGate locked={false}>
      <MonthDataSync
        activeTab="insights"
        monthKey={monthKey}
        monthLabel={monthLabel}
        carriedFromMonthLabel={carriedFromMonthLabel}
        budget={budget}
      >
        {hasBudgetMetrics ? (
          <ExpenseContentSuspense>
            <InsightsContentLoader monthKey={monthKey} budget={budget} />
          </ExpenseContentSuspense>
        ) : (
          <>
            <section className="rounded-2xl border border-dashed border-cardBorder bg-card/40 px-6 py-10 text-center">
              <p className="text-sm text-zinc-400">
                Set your income on the Overview page to unlock burn-rate telemetry
                and AI capital audits.
              </p>
            </section>
            <NavigationContentReady />
          </>
        )}
      </MonthDataSync>
    </AuthGate>
  );
}
