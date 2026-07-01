import AppShell from "@/components/AppShell";
import CategoriesContent from "@/components/CategoriesContent";
import {
  AuthGate,
  ClientSuspense,
  getAuthenticatedMonthPageData,
} from "@/lib/pageHelpers";

interface CategoriesPageProps {
  searchParams: Promise<{ month?: string; group?: string; category?: string }>;
}

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  const pageData = await getAuthenticatedMonthPageData(searchParams);

  if (pageData.locked) {
    return <AuthGate locked>{null}</AuthGate>;
  }

  const { monthKey, monthLabel, budget, expenses, carriedFromMonthLabel } = pageData;

  return (
    <AuthGate locked={false}>
      <AppShell
        activeTab="categories"
        currentMonthKey={monthKey}
        monthLabel={monthLabel}
        carriedFromMonthLabel={carriedFromMonthLabel}
        budget={budget}
      >
        <ClientSuspense>
          <CategoriesContent
            monthKey={monthKey}
            budget={budget}
            expenses={expenses}
          />
        </ClientSuspense>
      </AppShell>
    </AuthGate>
  );
}
