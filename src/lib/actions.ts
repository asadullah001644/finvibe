"use server";

import { cookies } from "next/headers";
import {
  addExpense,
  deleteExpense,
  getOrCreateMonthlyBudget,
  getExpensesForMonth,
  updateBudgetIncome,
  updateCategoryAllocations,
  updateExpense,
} from "@/actions/dbActions";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { isValidExpenseId, parseExpenseDate } from "@/lib/expenseDate";
import type { Budget, BudgetCategory, SerializedExpense } from "@/lib/types";

const SESSION_COOKIE = "finvibe_session";
const SESSION_VALUE = "unlocked";

export interface ExpenseInput {
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface IncomeInput {
  monthKey: string;
  totalSalary: number;
  savingsGoal: number;
}

export interface CategoryAllocationsInput {
  monthKey: string;
  categories: BudgetCategory[];
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

async function hasValidSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);

  return session?.value === SESSION_VALUE;
}

function sessionError(): ActionResult {
  return { success: false, error: "Session expired. Unlock the app and try again." };
}

function validateExpenseInput(
  expenseData: ExpenseInput,
): { ok: true; date: string } | { ok: false; error: string } {
  const { amount, category, description, date } = expenseData;
  const normalizedDate = parseExpenseDate(date);

  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Enter a valid amount greater than zero." };
  }

  if (!category.trim()) {
    return { ok: false, error: "Select a category to continue." };
  }

  if (!normalizedDate) {
    return { ok: false, error: "Enter a valid expense date." };
  }

  return {
    ok: true,
    date: normalizedDate,
  };
}

function actionError(error: unknown, fallback: string): ActionResult {
  console.error(fallback, error);
  const message = error instanceof Error ? error.message : fallback;
  return { success: false, error: message };
}

export async function saveExpenseAction(
  expenseData: ExpenseInput,
): Promise<ActionResult> {
  if (!(await hasValidSession())) {
    return sessionError();
  }

  const validated = validateExpenseInput(expenseData);

  if (!validated.ok) {
    return { success: false, error: validated.error };
  }

  try {
    await addExpense(
      expenseData.amount,
      expenseData.category.trim(),
      expenseData.description.trim(),
      validated.date,
    );
    return { success: true };
  } catch (error) {
    return actionError(error, "Could not save expense.");
  }
}

export async function updateExpenseAction(
  id: string,
  expenseData: ExpenseInput,
): Promise<ActionResult> {
  if (!(await hasValidSession())) {
    return sessionError();
  }

  if (!isValidExpenseId(id)) {
    return { success: false, error: "Invalid expense id." };
  }

  const validated = validateExpenseInput(expenseData);

  if (!validated.ok) {
    return { success: false, error: validated.error };
  }

  try {
    await updateExpense(
      id,
      expenseData.amount,
      expenseData.category.trim(),
      expenseData.description.trim(),
      validated.date,
    );
    return { success: true };
  } catch (error) {
    return actionError(error, "Could not update expense.");
  }
}

export async function deleteExpenseAction(id: string): Promise<ActionResult> {
  if (!(await hasValidSession())) {
    return sessionError();
  }

  if (!isValidExpenseId(id)) {
    return { success: false, error: "Invalid expense id." };
  }

  try {
    await deleteExpense(id);
    return { success: true };
  } catch (error) {
    return actionError(error, "Could not delete expense.");
  }
}

export async function saveIncomeAction(
  incomeData: IncomeInput,
): Promise<ActionResult> {
  if (!(await hasValidSession())) {
    return sessionError();
  }

  const { monthKey, totalSalary, savingsGoal } = incomeData;

  if (
    !monthKey ||
    !Number.isFinite(totalSalary) ||
    totalSalary <= 0 ||
    !Number.isFinite(savingsGoal) ||
    savingsGoal < 0 ||
    savingsGoal >= totalSalary
  ) {
    return { success: false, error: "Invalid salary or savings goal." };
  }

  try {
    await updateBudgetIncome(monthKey, totalSalary, savingsGoal);
    return { success: true };
  } catch (error) {
    return actionError(error, "Could not save income.");
  }
}

export async function saveCategoryAllocationsAction(
  allocationData: CategoryAllocationsInput,
): Promise<ActionResult> {
  if (!(await hasValidSession())) {
    return sessionError();
  }

  const { monthKey, categories } = allocationData;

  if (!monthKey || !Array.isArray(categories)) {
    return { success: false, error: "Invalid category data." };
  }

  try {
    await updateCategoryAllocations(monthKey, categories);
    return { success: true };
  } catch (error) {
    return actionError(error, "Could not save category limits.");
  }
}

export async function getOrCreateMonthlyBudgetAction(
  monthKey: string,
): Promise<Budget> {
  const fallbackBudget: Budget = {
    monthKey,
    totalSalary: 0,
    savingsGoal: 0,
    categories: DEFAULT_CATEGORIES,
  };

  try {
    if (!(await hasValidSession())) {
      return fallbackBudget;
    }

    return await getOrCreateMonthlyBudget(monthKey);
  } catch (error) {
    console.error("getOrCreateMonthlyBudgetAction:", error);
    return fallbackBudget;
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
  } catch (error) {
    console.error("getCurrentMonthExpensesAction:", error);
    return [];
  }
}
