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

  if (shellData.state === "pin_required") {
    return <AuthGate gateState={shellData}>{null}</AuthGate>;
  }

  const { monthKey, monthLabel, budget, carriedFromMonthLabel, isSuperAdmin, pinLockEnabled } =
    shellData;
  const hasBudgetMetrics = budget.totalSalary > 0 || budget.savingsGoal > 0;

  return (
    <AuthGate gateState={shellData}>
      <MonthDataSync
        activeTab="insights"
        monthKey={monthKey}
        monthLabel={monthLabel}
        carriedFromMonthLabel={carriedFromMonthLabel}
        budget={budget}
        pinLockEnabled={pinLockEnabled}
      >
        {hasBudgetMetrics ? (
          <ExpenseContentSuspense>
            <InsightsContentLoader
              monthKey={monthKey}
              budget={budget}
              isSuperAdmin={isSuperAdmin}
            />
          </ExpenseContentSuspense>
        ) : (
          <>
            <section className="rounded-2xl border border-dashed border-cardBorder bg-card/40 px-6 py-10 text-center">
              <p className="text-sm text-zinc-400">
                Set your income on the Overview page to unlock burn-rate telemetry
                {isSuperAdmin ? " and AI capital audits" : ""}.
              </p>
            </section>
            <NavigationContentReady />
          </>
        )}
      </MonthDataSync>
    </AuthGate>
  );
}
