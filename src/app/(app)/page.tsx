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
        activeTab="overview"
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
