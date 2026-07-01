import { format } from "date-fns";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { monthKeyToDate } from "@/lib/month";
import {
  getCurrentMonthExpensesAction,
  getOrCreateMonthlyBudgetAction,
} from "@/lib/actions";
import type { BudgetCategory } from "@/lib/types";

export interface MonthBudget {
  monthKey: string;
  totalSalary: number;
  savingsGoal: number;
  categories: BudgetCategory[];
}

export interface MonthExpense {
  _id?: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
}

export interface MonthData {
  monthKey: string;
  monthLabel: string;
  budget: MonthBudget;
  expenses: MonthExpense[];
}

export async function loadMonthData(monthKey: string): Promise<MonthData> {
  const monthLabel = format(monthKeyToDate(monthKey), "MMMM yyyy");

  let budget: MonthBudget = {
    monthKey,
    totalSalary: 0,
    savingsGoal: 0,
    categories: DEFAULT_CATEGORIES,
  };
  let expenses: MonthExpense[] = [];

  try {
    const [loadedBudget, loadedExpenses] = await Promise.all([
      getOrCreateMonthlyBudgetAction(monthKey),
      getCurrentMonthExpensesAction(monthKey),
    ]);

    budget = {
      monthKey: loadedBudget.monthKey ?? monthKey,
      totalSalary: loadedBudget.totalSalary ?? 0,
      savingsGoal: loadedBudget.savingsGoal ?? 0,
      categories:
        Array.isArray(loadedBudget.categories) &&
        loadedBudget.categories.length > 0
          ? loadedBudget.categories
          : DEFAULT_CATEGORIES,
    };
    expenses = Array.isArray(loadedExpenses) ? loadedExpenses : [];
  } catch {
    budget = {
      monthKey,
      totalSalary: 0,
      savingsGoal: 0,
      categories: DEFAULT_CATEGORIES,
    };
    expenses = [];
  }

  return { monthKey, monthLabel, budget, expenses };
}
