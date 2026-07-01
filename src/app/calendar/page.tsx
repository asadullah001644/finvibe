import AppShell from "@/components/AppShell";
import HeatmapCalendar from "@/components/HeatmapCalendar";
import {
  AuthGate,
  getAuthenticatedMonthPageData,
} from "@/lib/pageHelpers";

interface CalendarPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const pageData = await getAuthenticatedMonthPageData(searchParams);

  if (pageData.locked) {
    return <AuthGate locked>{null}</AuthGate>;
  }

  const { monthKey, monthLabel, budget, expenses, carriedFromMonthLabel } = pageData;
  const categoryNames = budget.categories.map((category) => category.name);

  return (
    <AuthGate locked={false}>
      <AppShell
        activeTab="calendar"
        currentMonthKey={monthKey}
        monthLabel={monthLabel}
        carriedFromMonthLabel={carriedFromMonthLabel}
        budget={budget}
      >
        <HeatmapCalendar
          monthKey={monthKey}
          expenses={expenses}
          categoryNames={categoryNames}
        />
      </AppShell>
    </AuthGate>
  );
}
