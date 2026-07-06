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
  const shellData = await getAuthenticatedShellData(searchParams, "/calendar");

  if (shellData.state === "pin_required") {
    return <AuthGate gateState={shellData}>{null}</AuthGate>;
  }

  const {
    monthKey,
    monthLabel,
    budget,
    carriedFromMonthLabel,
    pinLockEnabled,
    userDisplayName,
    userEmail,
    isSuperAdmin,
  } = shellData;

  return (
    <AuthGate gateState={shellData}>
      <MonthDataSync
        activeTab="calendar"
        monthKey={monthKey}
        monthLabel={monthLabel}
        carriedFromMonthLabel={carriedFromMonthLabel}
        budget={budget}
        pinLockEnabled={pinLockEnabled}
        userDisplayName={userDisplayName}
        userEmail={userEmail}
        isSuperAdmin={isSuperAdmin}
      >
        <ExpenseContentSuspense>
          <CalendarContentLoader monthKey={monthKey} budget={budget} />
        </ExpenseContentSuspense>
      </MonthDataSync>
    </AuthGate>
  );
}
