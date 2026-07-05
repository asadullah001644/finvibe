import { MonthDataSync } from "@/components/AppShellProvider";
import ExpenseContentSuspense from "@/components/ExpenseContentSuspense";
import CategoriesContentLoader from "@/components/loaders/CategoriesContentLoader";
import {
  AuthGate,
  getAuthenticatedShellData,
} from "@/lib/pageHelpers";

interface CategoriesPageProps {
  searchParams: Promise<{ month?: string; group?: string; category?: string }>;
}

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  const shellData = await getAuthenticatedShellData(searchParams);

  if (shellData.state === "pin_required") {
    return <AuthGate gateState={shellData}>{null}</AuthGate>;
  }

  const { monthKey, monthLabel, budget, carriedFromMonthLabel, pinLockEnabled } = shellData;

  return (
    <AuthGate gateState={shellData}>
      <MonthDataSync
        activeTab="categories"
        monthKey={monthKey}
        monthLabel={monthLabel}
        carriedFromMonthLabel={carriedFromMonthLabel}
        budget={budget}
        pinLockEnabled={pinLockEnabled}
      >
        <ExpenseContentSuspense>
          <CategoriesContentLoader monthKey={monthKey} budget={budget} />
        </ExpenseContentSuspense>
      </MonthDataSync>
    </AuthGate>
  );
}
