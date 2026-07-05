"use server";

import {
  addExpense,
  deleteExpense,
  deleteRecurringExpense,
  ensureMonthBudget,
  getExpensesForMonth,
  getMostRecentPriorBudget,
  getRecurringExpenses,
  saveRecurringExpense,
  seedRecurringExpensesForMonth,
  updateBudgetIncome,
  updateCategoryAllocations,
  updateExpense,
} from "@/actions/dbActions";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { isValidExpenseId, parseExpenseDate } from "@/lib/expenseDate";
import { actionSessionError, isActionSessionValid } from "@/lib/sessionGuard";
import type { Budget, BudgetCategory, RecurringExpense, SerializedExpense } from "@/lib/types";

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

export interface RecurringExpenseInput {
  id?: string;
  amount: number;
  category: string;
  description: string;
  isActive: boolean;
}

export interface EnsureMonthBudgetActionResult {
  budget: Budget;
  carriedFromMonthKey?: string;
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

async function hasValidSession(): Promise<boolean> {
  return isActionSessionValid();
}

function sessionError(): ActionResult {
  return actionSessionError();
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

export async function ensureMonthBudgetAction(
  monthKey: string,
): Promise<EnsureMonthBudgetActionResult> {
  const fallbackBudget: Budget = {
    monthKey,
    totalSalary: 0,
    savingsGoal: 0,
    categories: DEFAULT_CATEGORIES,
  };

  try {
    if (!(await hasValidSession())) {
      return { budget: fallbackBudget };
    }

    return await ensureMonthBudget(monthKey);
  } catch (error) {
    console.error("ensureMonthBudgetAction:", error);
    return { budget: fallbackBudget };
  }
}

export async function seedRecurringExpensesForMonthAction(
  monthKey: string,
): Promise<void> {
  try {
    if (!(await hasValidSession())) {
      return;
    }

    await seedRecurringExpensesForMonth(monthKey);
  } catch (error) {
    console.error("seedRecurringExpensesForMonthAction:", error);
  }
}

export async function getOrCreateMonthlyBudgetAction(
  monthKey: string,
): Promise<Budget> {
  const result = await ensureMonthBudgetAction(monthKey);
  return result.budget;
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

export async function getPriorMonthBudgetAction(
  monthKey: string,
): Promise<Budget | null> {
  try {
    if (!(await hasValidSession())) {
      return null;
    }

    return await getMostRecentPriorBudget(monthKey);
  } catch (error) {
    console.error("getPriorMonthBudgetAction:", error);
    return null;
  }
}

export async function getRecurringExpensesAction(): Promise<RecurringExpense[]> {
  try {
    if (!(await hasValidSession())) {
      return [];
    }

    return await getRecurringExpenses();
  } catch (error) {
    console.error("getRecurringExpensesAction:", error);
    return [];
  }
}

export async function saveRecurringExpenseAction(
  input: RecurringExpenseInput,
): Promise<ActionResult & { item?: RecurringExpense }> {
  if (!(await hasValidSession())) {
    return sessionError();
  }

  const { id, amount, category, description, isActive } = input;

  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, error: "Enter a valid amount greater than zero." };
  }

  if (!category.trim()) {
    return { success: false, error: "Select a category to continue." };
  }

  try {
    const item = await saveRecurringExpense({
      id,
      amount,
      category: category.trim(),
      description: description.trim(),
      isActive,
    });
    return { success: true, item };
  } catch (error) {
    return actionError(error, "Could not save recurring expense.");
  }
}

export async function deleteRecurringExpenseAction(
  id: string,
): Promise<ActionResult> {
  if (!(await hasValidSession())) {
    return sessionError();
  }

  if (!isValidExpenseId(id)) {
    return { success: false, error: "Invalid recurring expense id." };
  }

  try {
    await deleteRecurringExpense(id);
    return { success: true };
  } catch (error) {
    return actionError(error, "Could not delete recurring expense.");
  }
}
