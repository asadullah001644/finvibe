import { MonthDataSync } from "@/components/AppShellProvider";
import ExpenseContentSuspense from "@/components/ExpenseContentSuspense";
import CategoriesContentLoader from "@/components/loaders/CategoriesContentLoader";
import CategoriesPageSkeleton from "@/components/skeletons/CategoriesPageSkeleton";
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
  const params = await searchParams;
  const shellData = await getAuthenticatedShellData(
    Promise.resolve(params),
    "/categories",
    { group: params.group, category: params.category },
  );

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
        activeTab="categories"
        monthKey={monthKey}
        monthLabel={monthLabel}
        carriedFromMonthLabel={carriedFromMonthLabel}
        budget={budget}
        pinLockEnabled={pinLockEnabled}
        userDisplayName={userDisplayName}
        userEmail={userEmail}
        isSuperAdmin={isSuperAdmin}
      >
        <ExpenseContentSuspense fallback={<CategoriesPageSkeleton />}>
          <CategoriesContentLoader monthKey={monthKey} budget={budget} />
        </ExpenseContentSuspense>
      </MonthDataSync>
    </AuthGate>
  );
}
