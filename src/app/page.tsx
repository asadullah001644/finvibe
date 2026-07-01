import { format } from "date-fns";
import { cookies } from "next/headers";
import DashboardShell from "@/components/DashboardShell";
import PinUnlock from "@/components/PinUnlock";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { resolveMonthKey, monthKeyToDate } from "@/lib/month";
import {
  getCurrentMonthExpensesAction,
  getOrCreateMonthlyBudgetAction,
} from "@/lib/actions";

interface DashboardPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const cookieStore = await cookies();
  const session = cookieStore.get("finvibe_session");
  const isUnlocked = session?.value === "unlocked";

  if (!isUnlocked) {
    return <PinUnlock />;
  }

  const params = await searchParams;
  const currentMonthKey = resolveMonthKey(params.month);
  const monthLabel = format(monthKeyToDate(currentMonthKey), "MMMM yyyy");

  let budget = {
    monthKey: currentMonthKey,
    totalSalary: 0,
    savingsGoal: 0,
    categories: DEFAULT_CATEGORIES,
  };
  let expenses: Awaited<ReturnType<typeof getCurrentMonthExpensesAction>> = [];

  try {
    const [loadedBudget, loadedExpenses] = await Promise.all([
      getOrCreateMonthlyBudgetAction(currentMonthKey),
      getCurrentMonthExpensesAction(currentMonthKey),
    ]);

    budget = {
      monthKey: loadedBudget.monthKey ?? currentMonthKey,
      totalSalary: loadedBudget.totalSalary ?? 0,
      savingsGoal: loadedBudget.savingsGoal ?? 0,
      categories:
        Array.isArray(loadedBudget.categories) && loadedBudget.categories.length > 0
          ? loadedBudget.categories
          : DEFAULT_CATEGORIES,
    };
    expenses = Array.isArray(loadedExpenses) ? loadedExpenses : [];
  } catch {
    budget = {
      monthKey: currentMonthKey,
      totalSalary: 0,
      savingsGoal: 0,
      categories: DEFAULT_CATEGORIES,
    };
    expenses = [];
  }

  return (
    <DashboardShell
      currentMonthKey={currentMonthKey}
      monthLabel={monthLabel}
      budget={budget}
      expenses={expenses}
    />
  );
}
