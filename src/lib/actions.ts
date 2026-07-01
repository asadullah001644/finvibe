"use server";

import { cookies } from "next/headers";
import {
  addExpense,
  deleteExpense,
  getOrCreateMonthlyBudget,
  getExpensesForMonth,
  updateBudget,
  updateExpense,
} from "@/actions/dbActions";
import type { Budget, BudgetCategory, SerializedExpense } from "@/lib/types";

const SESSION_COOKIE = "finvibe_session";
const SESSION_VALUE = "unlocked";

export interface ExpenseInput {
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface BudgetInput {
  monthKey: string;
  totalSalary: number;
  savingsGoal: number;
  categories: BudgetCategory[];
}

async function hasValidSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);

  return session?.value === SESSION_VALUE;
}

export async function saveExpenseAction(
  expenseData: ExpenseInput,
): Promise<{ success: boolean }> {
  if (!(await hasValidSession())) {
    return { success: false };
  }

  const { amount, category, description, date } = expenseData;

  if (!Number.isFinite(amount) || amount <= 0 || !category.trim() || !date) {
    return { success: false };
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return { success: false };
  }

  try {
    await addExpense(amount, category.trim(), description.trim(), date);
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function updateExpenseAction(
  id: string,
  expenseData: ExpenseInput,
): Promise<{ success: boolean }> {
  if (!(await hasValidSession())) {
    return { success: false };
  }

  const { amount, category, description, date } = expenseData;

  if (
    !id ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !category.trim() ||
    !date
  ) {
    return { success: false };
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return { success: false };
  }

  try {
    await updateExpense(id, amount, category.trim(), description.trim(), date);
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function deleteExpenseAction(
  id: string,
): Promise<{ success: boolean }> {
  if (!(await hasValidSession())) {
    return { success: false };
  }

  if (!id) {
    return { success: false };
  }

  try {
    await deleteExpense(id);
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function saveBudgetAction(
  budgetData: BudgetInput,
): Promise<{ success: boolean }> {
  if (!(await hasValidSession())) {
    return { success: false };
  }

  const { monthKey, totalSalary, savingsGoal, categories } = budgetData;

  if (
    !monthKey ||
    !Number.isFinite(totalSalary) ||
    totalSalary < 0 ||
    !Number.isFinite(savingsGoal) ||
    savingsGoal < 0 ||
    !Array.isArray(categories)
  ) {
    return { success: false };
  }

  try {
    await updateBudget(monthKey, totalSalary, savingsGoal, categories);
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function getOrCreateMonthlyBudgetAction(
  monthKey: string,
): Promise<Budget> {
  try {
    if (!(await hasValidSession())) {
      return {
        monthKey,
        totalSalary: 0,
        savingsGoal: 0,
        categories: [],
      };
    }

    return await getOrCreateMonthlyBudget(monthKey);
  } catch {
    return {
      monthKey,
      totalSalary: 0,
      savingsGoal: 0,
      categories: [],
    };
  }
}

export async function getCurrentMonthExpensesAction(
  monthKey: string,
): Promise<SerializedExpense[]> {
  try {
    if (!(await hasValidSession())) {
      return [];
    }

    return await getExpensesForMonth(monthKey);
  } catch {
    return [];
  }
}
