import AppShell from "@/components/AppShell";
import OverviewContent from "@/components/OverviewContent";
import {
  AuthGate,
  getAuthenticatedMonthPageData,
} from "@/lib/pageHelpers";

interface OverviewPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function OverviewPage({ searchParams }: OverviewPageProps) {
  const pageData = await getAuthenticatedMonthPageData(searchParams);

  if (pageData.locked) {
    return <AuthGate locked>{null}</AuthGate>;
  }

  const { monthKey, monthLabel, budget, expenses, carriedFromMonthLabel } = pageData;

  return (
    <AuthGate locked={false}>
      <AppShell
        activeTab="overview"
        currentMonthKey={monthKey}
        monthLabel={monthLabel}
        carriedFromMonthLabel={carriedFromMonthLabel}
        budget={budget}
      >
        <OverviewContent
          monthKey={monthKey}
          monthLabel={monthLabel}
          budget={budget}
          expenses={expenses}
        />
      </AppShell>
    </AuthGate>
  );
}
