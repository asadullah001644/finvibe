import { cache } from "react";
import { format } from "date-fns";
import {
  ensureMonthBudget,
  getExpensesForMonth,
  seedRecurringExpensesForMonth,
} from "@/actions/dbActions";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { formatMonthLabel, monthKeyToDate } from "@/lib/month";
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

export interface MonthShellData {
  monthKey: string;
  monthLabel: string;
  budget: MonthBudget;
  carriedFromMonthLabel?: string;
}

export interface MonthData extends MonthShellData {
  expenses: MonthExpense[];
}

const seedRecurringForMonthCached = cache(seedRecurringExpensesForMonth);

async function loadMonthShellDataImpl(monthKey: string): Promise<MonthShellData> {
  const monthLabel = format(monthKeyToDate(monthKey), "MMMM yyyy");

  try {
    const { budget: loadedBudget, carriedFromMonthKey } =
      await ensureMonthBudget(monthKey);

    const budget: MonthBudget = {
      monthKey: loadedBudget.monthKey ?? monthKey,
      totalSalary: loadedBudget.totalSalary ?? 0,
      savingsGoal: loadedBudget.savingsGoal ?? 0,
      categories:
        Array.isArray(loadedBudget.categories) &&
        loadedBudget.categories.length > 0
          ? loadedBudget.categories
          : DEFAULT_CATEGORIES,
    };

    return {
      monthKey,
      monthLabel,
      budget,
      carriedFromMonthLabel: carriedFromMonthKey
        ? formatMonthLabel(carriedFromMonthKey)
        : undefined,
    };
  } catch {
    return {
      monthKey,
      monthLabel,
      budget: {
        monthKey,
        totalSalary: 0,
        savingsGoal: 0,
        categories: DEFAULT_CATEGORIES,
      },
    };
  }
}

async function loadMonthExpensesImpl(monthKey: string): Promise<MonthExpense[]> {
  try {
    await seedRecurringForMonthCached(monthKey);

    const loadedExpenses = await getExpensesForMonth(monthKey);
    return Array.isArray(loadedExpenses) ? loadedExpenses : [];
  } catch {
    return [];
  }
}

async function loadMonthDataImpl(monthKey: string): Promise<MonthData> {
  const shell = await loadMonthShellDataImpl(monthKey);
  const expenses = await loadMonthExpensesImpl(monthKey);

  return { ...shell, expenses };
}

export const loadMonthShellData = cache(loadMonthShellDataImpl);
export const loadMonthExpenses = cache(loadMonthExpensesImpl);
export const loadMonthData = cache(loadMonthDataImpl);
