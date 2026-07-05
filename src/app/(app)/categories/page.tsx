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

  if (shellData.locked) {
    return <AuthGate locked>{null}</AuthGate>;
  }

  const { monthKey, monthLabel, budget, carriedFromMonthLabel } = shellData;

  return (
    <AuthGate locked={false}>
      <MonthDataSync
        activeTab="categories"
        monthKey={monthKey}
        monthLabel={monthLabel}
        carriedFromMonthLabel={carriedFromMonthLabel}
        budget={budget}
      >
        <ExpenseContentSuspense>
          <CategoriesContentLoader monthKey={monthKey} budget={budget} />
        </ExpenseContentSuspense>
      </MonthDataSync>
    </AuthGate>
  );
}
