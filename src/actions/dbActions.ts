import { createClient } from "@/utils/supabase/server";
import { getSessionUser } from "@/lib/auth";
import type {
  Budget,
  BudgetCategory,
  RecurringExpense,
  SerializedExpense,
} from "@/lib/types";
import { DEFAULT_CATEGORIES, mergeWithDefaultCategories } from "@/lib/constants";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

function userDataTag(userId: string): string {
  return `user-data-${userId}`;
}

function budgetTag(userId: string, monthKey: string): string {
  return `budget-${userId}-${monthKey}`;
}

function expensesTag(userId: string, monthKey: string): string {
  return `expenses-${userId}-${monthKey}`;
}

async function revalidateAppData(): Promise<void> {
  revalidatePath("/", "layout");

  const user = await getSessionUser();
  if (user) {
    revalidateTag(userDataTag(user.id), "max");
  }
}

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
  created_at?: string;
  recurring_expense_id?: string | null;
}

interface RecurringExpenseRow {
  id: string;
  amount: number;
  category: string;
  description: string | null;
  is_active: boolean;
}

interface BudgetPatchFields {
  total_salary?: number;
  savings_goal?: number;
  categories?: BudgetCategory[];
}

interface BudgetInsertDefaults {
  total_salary: number;
  savings_goal: number;
  categories: BudgetCategory[];
}

export interface EnsureMonthBudgetResult {
  budget: Budget;
  carriedFromMonthKey?: string;
}

function isMeaningfulBudget(budget: Budget): boolean {
  return (
    budget.totalSalary > 0 ||
    budget.savingsGoal > 0 ||
    budget.categories.some((category) => category.allocated > 0)
  );
}

function mapRecurringExpenseRow(row: RecurringExpenseRow): RecurringExpense {
  return {
    id: row.id,
    amount: Number(row.amount ?? 0),
    category: row.category ?? "General",
    description: row.description ?? "",
    isActive: row.is_active ?? true,
  };
}

function isDuplicateKeyError(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}

function isRecurringSchemaUnavailableError(
  error: { code?: string; message?: string } | null,
): boolean {
  if (!error) {
    return false;
  }

  const message = error.message ?? "";

  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    message.includes("recurring_expenses") ||
    message.includes("recurring_expense_id")
  );
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

const BUDGET_COLUMNS = "month_key, total_salary, savings_goal, categories";
const EXPENSE_COLUMNS = "id, amount, category, description, date, created_at";
const RECURRING_SEED_COLUMNS = "id, amount, category, description";

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
    categories: mergeWithDefaultCategories(row.categories),
  };
}

function mapExpenseRow(row: ExpenseRow): SerializedExpense {
  return {
    _id: row.id,
    amount: Number(row.amount ?? 0),
    category: row.category ?? "General",
    description: row.description ?? "",
    date: new Date(row.date),
    createdAt: row.created_at ? new Date(row.created_at) : undefined,
  };
}

async function fetchBudget(
  monthKey: string,
  userId?: string | null,
): Promise<Budget | null> {
  const supabase = await createClient();

  let query = supabase
    .from("budgets")
    .select(BUDGET_COLUMNS)
    .eq("month_key", monthKey);

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Error fetching budget:", error);
    throw new Error(error.message);
  }

  return data ? mapBudgetRow(data as BudgetRow, monthKey) : null;
}

export async function getBudget(monthKey: string): Promise<Budget | null> {
  const user = await getSessionUser();

  if (!user) {
    return fetchBudget(monthKey);
  }

  return unstable_cache(
    () => fetchBudget(monthKey, user.id),
    ["budget", user.id, monthKey],
    {
      revalidate: 30,
      tags: [budgetTag(user.id, monthKey), userDataTag(user.id)],
    },
  )();
}

export async function getMostRecentPriorBudget(
  monthKey: string,
): Promise<Budget | null> {
  const supabase = await createClient();
  const user = await getSessionUser();

  let query = supabase
    .from("budgets")
    .select(BUDGET_COLUMNS)
    .lt("month_key", monthKey)
    .order("month_key", { ascending: false })
    .limit(1);

  if (user?.id) {
    query = query.eq("user_id", user.id);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("Error fetching prior budget:", error);
    throw new Error(error.message);
  }

  return data
    ? mapBudgetRow(data as BudgetRow, (data as BudgetRow).month_key)
    : null;
}

async function createEmptyBudget(monthKey: string): Promise<Budget> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("budgets")
    .insert({
      month_key: monthKey,
      total_salary: 0,
      savings_goal: 0,
      categories: DEFAULT_CATEGORIES,
    })
    .select(BUDGET_COLUMNS)
    .single();

  if (error) {
    if (isDuplicateKeyError(error)) {
      const raced = await getBudget(monthKey);
      if (raced) {
        return raced;
      }
    }

    console.error("Error creating budget:", error);
    throw new Error(error.message);
  }

  return mapBudgetRow(data as BudgetRow, monthKey);
}

export async function ensureMonthBudget(
  monthKey: string,
): Promise<EnsureMonthBudgetResult> {
  const existing = await getBudget(monthKey);

  if (existing && isMeaningfulBudget(existing)) {
    return { budget: existing };
  }

  const prior = await getMostRecentPriorBudget(monthKey);

  if (prior) {
    const carriedCategories = mergeWithDefaultCategories(prior.categories);

    await patchBudgetRow(
      monthKey,
      {
        total_salary: prior.totalSalary,
        savings_goal: prior.savingsGoal,
        categories: carriedCategories,
      },
      {
        total_salary: prior.totalSalary,
        savings_goal: prior.savingsGoal,
        categories: carriedCategories,
      },
    );

    return {
      budget: {
        monthKey,
        totalSalary: prior.totalSalary,
        savingsGoal: prior.savingsGoal,
        categories: carriedCategories,
      },
      carriedFromMonthKey: prior.monthKey,
    };
  }

  if (existing) {
    return { budget: existing };
  }

  const budget = await createEmptyBudget(monthKey);
  return { budget };
}

export async function getOrCreateMonthlyBudget(monthKey: string): Promise<Budget> {
  const result = await ensureMonthBudget(monthKey);
  return result.budget;
}

async function patchBudgetRow(
  monthKey: string,
  fields: BudgetPatchFields,
  insertDefaults: BudgetInsertDefaults,
) {
  const supabase = await createClient();
  const user = await getSessionUser();
  const userId = user?.id;

  const applyUpdate = async () => {
    let query = supabase.from("budgets").update(fields).eq("month_key", monthKey);
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { error } = await query;

    if (error) {
      throw new Error(error.message);
    }
  };

  let fetchQuery = supabase
    .from("budgets")
    .select("month_key")
    .eq("month_key", monthKey);

  if (userId) {
    fetchQuery = fetchQuery.eq("user_id", userId);
  }

  const { data: existing, error: fetchError } = await fetchQuery.maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (existing) {
    await applyUpdate();
  } else {
    const { error } = await supabase.from("budgets").insert({
      month_key: monthKey,
      ...insertDefaults,
      ...fields,
    });

    if (error) {
      if (isDuplicateKeyError(error)) {
        await applyUpdate();
      } else {
        throw new Error(error.message);
      }
    }
  }

  await revalidateAppData();
}

export async function updateBudgetIncome(
  monthKey: string,
  totalSalary: number,
  savingsGoal: number,
) {
  await patchBudgetRow(
    monthKey,
    { total_salary: totalSalary, savings_goal: savingsGoal },
    {
      total_salary: totalSalary,
      savings_goal: savingsGoal,
      categories: DEFAULT_CATEGORIES,
    },
  );
}

export async function updateCategoryAllocations(
  monthKey: string,
  categories: BudgetCategory[],
) {
  const existing = await getBudget(monthKey);

  await patchBudgetRow(
    monthKey,
    { categories },
    {
      total_salary: existing?.totalSalary ?? 0,
      savings_goal: existing?.savingsGoal ?? 0,
      categories,
    },
  );
}

export async function addExpense(
  amount: number,
  category: string,
  description: string,
  date: string,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("expenses")
    .insert({ amount, category, description, date })
    .select();

  if (error) {
    throw new Error(error.message);
  }

  await revalidateAppData();
  return data;
}

export async function updateExpense(
  id: string,
  amount: number,
  category: string,
  description: string,
  date: string,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("expenses")
    .update({ amount, category, description, date })
    .eq("id", id)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("Expense not found.");
  }

  await revalidateAppData();
  return data;
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("Expense not found.");
  }

  await revalidateAppData();
}

export async function getExpenses(): Promise<SerializedExpense[]> {
  const supabase = await createClient();
  const user = await getSessionUser();

  let query = supabase
    .from("expenses")
    .select("*")
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (user?.id) {
    query = query.eq("user_id", user.id);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching expenses:", error);
    return [];
  }

  return (data as ExpenseRow[]).map(mapExpenseRow);
}

async function fetchExpensesForMonth(
  monthKey: string,
  userId?: string | null,
): Promise<SerializedExpense[]> {
  const range = getMonthDateRange(monthKey);

  if (!range) {
    return [];
  }

  const supabase = await createClient();

  let query = supabase
    .from("expenses")
    .select(EXPENSE_COLUMNS)
    .gte("date", range.start)
    .lte("date", range.end)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (userId) {
    query = query.eq("user_id", userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching month expenses:", error);
    throw new Error(error.message);
  }

  return (data as ExpenseRow[]).map(mapExpenseRow);
}

export async function getExpensesForMonth(
  monthKey: string,
): Promise<SerializedExpense[]> {
  const user = await getSessionUser();

  if (!user) {
    return fetchExpensesForMonth(monthKey);
  }

  return unstable_cache(
    () => fetchExpensesForMonth(monthKey, user.id),
    ["expenses", user.id, monthKey],
    {
      revalidate: 30,
      tags: [expensesTag(user.id, monthKey), userDataTag(user.id)],
    },
  )();
}

export async function getRecurringExpenses(): Promise<RecurringExpense[]> {
  const supabase = await createClient();
  const user = await getSessionUser();

  let query = supabase
    .from("recurring_expenses")
    .select("*")
    .order("created_at", { ascending: true });

  if (user?.id) {
    query = query.eq("user_id", user.id);
  }

  const { data, error } = await query;

  if (error) {
    if (isRecurringSchemaUnavailableError(error)) {
      console.warn(
        "Recurring expenses table not found — run supabase/migrations/002_recurring_expenses.sql in the Supabase SQL editor.",
      );
      return [];
    }

    console.error("Error fetching recurring expenses:", error);
    throw new Error(error.message);
  }

  return (data as RecurringExpenseRow[]).map(mapRecurringExpenseRow);
}

export async function saveRecurringExpense(
  input: {
    id?: string;
    amount: number;
    category: string;
    description: string;
    isActive: boolean;
  },
): Promise<RecurringExpense> {
  const supabase = await createClient();
  const payload = {
    amount: input.amount,
    category: input.category,
    description: input.description,
    is_active: input.isActive,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { data, error } = await supabase
      .from("recurring_expenses")
      .update(payload)
      .eq("id", input.id)
      .select("*")
      .single();

    if (error) {
      if (isRecurringSchemaUnavailableError(error)) {
        throw new Error(
          "Recurring expenses are not set up yet. Run supabase/migrations/002_recurring_expenses.sql in the Supabase SQL editor.",
        );
      }

      throw new Error(error.message);
    }

    await revalidateAppData();
    return mapRecurringExpenseRow(data as RecurringExpenseRow);
  }

  const { data, error } = await supabase
    .from("recurring_expenses")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    if (isRecurringSchemaUnavailableError(error)) {
      throw new Error(
        "Recurring expenses are not set up yet. Run supabase/migrations/002_recurring_expenses.sql in the Supabase SQL editor.",
      );
    }

    throw new Error(error.message);
  }

  await revalidateAppData();
  return mapRecurringExpenseRow(data as RecurringExpenseRow);
}

export async function deleteRecurringExpense(id: string): Promise<void> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("recurring_expenses")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) {
    if (isRecurringSchemaUnavailableError(error)) {
      throw new Error(
        "Recurring expenses are not set up yet. Run supabase/migrations/002_recurring_expenses.sql in the Supabase SQL editor.",
      );
    }

    throw new Error(error.message);
  }

  if (!data || data.length === 0) {
    throw new Error("Recurring expense not found.");
  }

  await revalidateAppData();
}

export async function seedRecurringExpensesForMonth(
  monthKey: string,
): Promise<void> {
  const range = getMonthDateRange(monthKey);

  if (!range) {
    return;
  }

  const supabase = await createClient();
  const user = await getSessionUser();

  let countQuery = supabase
    .from("recurring_expenses")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  if (user?.id) {
    countQuery = countQuery.eq("user_id", user.id);
  }

  const { count: activeRecurringCount, error: countError } = await countQuery;

  if (countError) {
    if (isRecurringSchemaUnavailableError(countError)) {
      return;
    }

    throw new Error(countError.message);
  }

  if (!activeRecurringCount) {
    return;
  }

  let recurringQuery = supabase
    .from("recurring_expenses")
    .select(RECURRING_SEED_COLUMNS)
    .eq("is_active", true);

  let seededQuery = supabase
    .from("expenses")
    .select("recurring_expense_id")
    .gte("date", range.start)
    .lte("date", range.end)
    .not("recurring_expense_id", "is", null);

  if (user?.id) {
    recurringQuery = recurringQuery.eq("user_id", user.id);
    seededQuery = seededQuery.eq("user_id", user.id);
  }

  const [recurringResult, seededResult] = await Promise.all([
    recurringQuery,
    seededQuery,
  ]);

  if (recurringResult.error) {
    if (isRecurringSchemaUnavailableError(recurringResult.error)) {
      console.warn(
        "Recurring expenses table not found — run supabase/migrations/002_recurring_expenses.sql in the Supabase SQL editor.",
      );
      return;
    }

    throw new Error(recurringResult.error.message);
  }

  if (seededResult.error) {
    if (isRecurringSchemaUnavailableError(seededResult.error)) {
      console.warn(
        "expenses.recurring_expense_id column not found — run supabase/migrations/002_recurring_expenses.sql in the Supabase SQL editor.",
      );
      return;
    }

    throw new Error(seededResult.error.message);
  }

  const seededIds = new Set(
    (seededResult.data ?? [])
      .map((row) => row.recurring_expense_id)
      .filter(Boolean),
  );

  const toSeed = (recurringResult.data as RecurringExpenseRow[]).filter(
    (item) => !seededIds.has(item.id),
  );

  if (toSeed.length === 0) {
    return;
  }

  const { error } = await supabase.from("expenses").insert(
    toSeed.map((item) => ({
      amount: item.amount,
      category: item.category,
      description: item.description ?? "",
      date: range.start,
      recurring_expense_id: item.id,
    })),
  );

  if (error) {
    throw new Error(error.message);
  }

  await revalidateAppData();
}
