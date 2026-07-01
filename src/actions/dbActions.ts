"use server";

import { createClient } from "@/utils/supabase/server";
import type { Budget, BudgetCategory, SerializedExpense } from "@/lib/types";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { revalidatePath } from "next/cache";

interface BudgetRow {
  id?: string;
  month_key: string;
  total_salary: number | null;
  savings_goal: number | null;
  categories?: BudgetCategory[] | null;
}

interface ExpenseRow {
  id: string;
  amount: number;
  category: string;
  description: string | null;
  date: string;
}

function parseMonthKey(monthKey: string): { year: number; monthIndex: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey);

  if (!match) {
    return null;
  }

  const year = Number.parseInt(match[1], 10);
  const monthIndex = Number.parseInt(match[2], 10) - 1;

  if (
    Number.isNaN(year) ||
    Number.isNaN(monthIndex) ||
    monthIndex < 0 ||
    monthIndex > 11
  ) {
    return null;
  }

  return { year, monthIndex };
}

function getMonthDateRange(monthKey: string): { start: string; end: string } | null {
  const parsed = parseMonthKey(monthKey);

  if (!parsed) {
    return null;
  }

  const { year, monthIndex } = parsed;
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const month = String(monthIndex + 1).padStart(2, "0");

  return {
    start: `${year}-${month}-01`,
    end: `${year}-${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

function mapBudgetRow(row: BudgetRow | null, monthKey: string): Budget {
  if (!row) {
    return {
      monthKey,
      totalSalary: 0,
      savingsGoal: 0,
      categories: DEFAULT_CATEGORIES,
    };
  }

  return {
    monthKey: row.month_key,
    totalSalary: Number(row.total_salary ?? 0),
    savingsGoal: Number(row.savings_goal ?? 0),
    categories:
      Array.isArray(row.categories) && row.categories.length > 0
        ? row.categories
        : DEFAULT_CATEGORIES,
  };
}

function mapExpenseRow(row: ExpenseRow): SerializedExpense {
  return {
    _id: row.id,
    amount: Number(row.amount ?? 0),
    category: row.category ?? "General",
    description: row.description ?? "",
    date: new Date(row.date),
  };
}

export async function getBudget(monthKey: string): Promise<Budget | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("budgets")
    .select("*")
    .eq("month_key", monthKey)
    .maybeSingle();

  if (error) {
    console.error("Error fetching budget:", error);
    return null;
  }

  return data ? mapBudgetRow(data as BudgetRow, monthKey) : null;
}

export async function getOrCreateMonthlyBudget(monthKey: string): Promise<Budget> {
  const existing = await getBudget(monthKey);

  if (existing) {
    return existing;
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("budgets")
    .insert({
      month_key: monthKey,
      total_salary: 0,
      savings_goal: 0,
      categories: DEFAULT_CATEGORIES,
    })
    .select("*")
    .single();

  if (error) {
    console.error("Error creating budget:", error);
    return mapBudgetRow(null, monthKey);
  }

  return mapBudgetRow(data as BudgetRow, monthKey);
}

export async function updateBudget(
  monthKey: string,
  totalSalary: number,
  savingsGoal: number,
  categories: BudgetCategory[],
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("budgets")
    .upsert(
      {
        month_key: monthKey,
        total_salary: totalSalary,
        savings_goal: savingsGoal,
        categories,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "month_key" },
    )
    .select();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  return data;
}

export async function addExpense(
  amount: number,
  category: string,
  description: string,
  dateIsoString: string,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("expenses")
    .insert([{ amount, category, description, date: dateIsoString }])
    .select();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  return data;
}

export async function updateExpense(
  id: string,
  amount: number,
  category: string,
  description: string,
  dateIsoString: string,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("expenses")
    .update({ amount, category, description, date: dateIsoString })
    .eq("id", id)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  return data;
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
}

export async function getExpenses(): Promise<SerializedExpense[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching expenses:", error);
    return [];
  }

  return (data as ExpenseRow[]).map(mapExpenseRow);
}

export async function getExpensesForMonth(
  monthKey: string,
): Promise<SerializedExpense[]> {
  const range = getMonthDateRange(monthKey);

  if (!range) {
    return [];
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .gte("date", range.start)
    .lte("date", range.end)
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching month expenses:", error);
    return [];
  }

  return (data as ExpenseRow[]).map(mapExpenseRow);
}
