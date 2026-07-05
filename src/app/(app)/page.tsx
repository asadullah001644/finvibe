import { MonthDataSync } from "@/components/AppShellProvider";
import ExpenseContentSuspense from "@/components/ExpenseContentSuspense";
import OverviewContentLoader from "@/components/loaders/OverviewContentLoader";
import {
  AuthGate,
  getAuthenticatedShellData,
} from "@/lib/pageHelpers";

interface OverviewPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function OverviewPage({ searchParams }: OverviewPageProps) {
  const shellData = await getAuthenticatedShellData(searchParams);

  if (shellData.locked) {
    return <AuthGate locked>{null}</AuthGate>;
  }

  const { monthKey, monthLabel, budget, carriedFromMonthLabel } = shellData;

  return (
    <AuthGate locked={false}>
      <MonthDataSync
        activeTab="overview"
        monthKey={monthKey}
        monthLabel={monthLabel}
        carriedFromMonthLabel={carriedFromMonthLabel}
        budget={budget}
      >
        <ExpenseContentSuspense>
          <OverviewContentLoader
            monthKey={monthKey}
            monthLabel={monthLabel}
            budget={budget}
          />
        </ExpenseContentSuspense>
      </MonthDataSync>
    </AuthGate>
  );
}
