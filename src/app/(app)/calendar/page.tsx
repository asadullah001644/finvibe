import { MonthDataSync } from "@/components/AppShellProvider";
import ExpenseContentSuspense from "@/components/ExpenseContentSuspense";
import CalendarContentLoader from "@/components/loaders/CalendarContentLoader";
import {
  AuthGate,
  getAuthenticatedShellData,
} from "@/lib/pageHelpers";

interface CalendarPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const shellData = await getAuthenticatedShellData(searchParams);

  if (shellData.locked) {
    return <AuthGate locked>{null}</AuthGate>;
  }

  const { monthKey, monthLabel, budget, carriedFromMonthLabel } = shellData;

  return (
    <AuthGate locked={false}>
      <MonthDataSync
        activeTab="calendar"
        monthKey={monthKey}
        monthLabel={monthLabel}
        carriedFromMonthLabel={carriedFromMonthLabel}
        budget={budget}
      >
        <ExpenseContentSuspense>
          <CalendarContentLoader monthKey={monthKey} budget={budget} />
        </ExpenseContentSuspense>
      </MonthDataSync>
    </AuthGate>
  );
}
