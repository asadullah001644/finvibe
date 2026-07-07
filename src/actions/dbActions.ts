import { createClient } from "@/utils/supabase/server";
import { getProfileOrDefault, getSessionUser, isSuperAdmin } from "@/lib/auth";
import { resolveMonthKey } from "@/lib/month";
import type {
  Budget,
  BudgetCategory,
  SerializedExpense,
} from "@/lib/types";
import { DEFAULT_CATEGORIES, mergeWithDefaultCategories } from "@/lib/constants";
import {
  mapCustomCategoryRow,
  validateCustomCategoryInput,
  type CustomCategoryRecord,
} from "@/lib/customCategories";
import { isCustomCategoriesTableMissing } from "@/lib/schema";
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

const GLOBAL_CUSTOM_CATEGORIES_TAG = "custom-categories-global";

async function requireSuperAdminForCategoryManagement(): Promise<void> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("You must be signed in.");
  }

  const profile = await getProfileOrDefault(user);
  if (!isSuperAdmin(profile)) {
    throw new Error("Only super admins can manage categories.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("custom_categories").select("id").limit(1);

  if (error && isCustomCategoriesTableMissing(error)) {
    throw new Error(
      "Custom categories are not set up yet. Run migration 008_global_custom_categories.sql in Supabase.",
    );
  }
}

interface DbWriteOptions {
  revalidate?: boolean;
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

function isDuplicateKeyError(error: { code?: string } | null): boolean {
  return error?.code === "23505";
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

async function fetchCustomCategoryPaths(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("custom_categories")
    .select("group_label, leaf_name, id, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    if (isCustomCategoriesTableMissing(error)) {
      return [];
    }

    console.error("Error fetching custom categories:", error);
    return [];
  }

  return (data ?? []).map((row) => mapCustomCategoryRow(row).fullName);
}

async function getCustomCategoryPaths(): Promise<string[]> {
  return unstable_cache(
    fetchCustomCategoryPaths,
    ["custom-category-paths-global"],
    {
      revalidate: 30,
      tags: [GLOBAL_CUSTOM_CATEGORIES_TAG],
    },
  )();
}

async function getMergedCategories(
  stored: BudgetCategory[] | null | undefined,
): Promise<BudgetCategory[]> {
  const customPaths = await getCustomCategoryPaths();
  return mergeWithDefaultCategories(stored, customPaths);
}

async function mapBudgetRow(
  row: BudgetRow | null,
  monthKey: string,
): Promise<Budget> {
  if (!row) {
    return {
      monthKey,
      totalSalary: 0,
      savingsGoal: 0,
      categories: await getMergedCategories(null),
    };
  }

  return {
    monthKey: row.month_key,
    totalSalary: Number(row.total_salary ?? 0),
    savingsGoal: Number(row.savings_goal ?? 0),
    categories: await getMergedCategories(row.categories),
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

  return data ? await mapBudgetRow(data as BudgetRow, monthKey) : null;
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
    ? await mapBudgetRow(data as BudgetRow, (data as BudgetRow).month_key)
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

  return await mapBudgetRow(data as BudgetRow, monthKey);
}

export async function ensureMonthBudget(
  monthKey: string,
): Promise<EnsureMonthBudgetResult> {
  const user = await getSessionUser();
  const existing = await fetchBudget(monthKey, user?.id);

  if (existing && isMeaningfulBudget(existing)) {
    return { budget: existing };
  }

  const prior = await getMostRecentPriorBudget(monthKey);

  if (prior) {
    const carriedCategories = prior.categories;

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
      { revalidate: false },
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
  options: DbWriteOptions = {},
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

  if (options.revalidate !== false) {
    await revalidateAppData();
  }
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

async function getMostRecentBudgetMonthKey(
  userId: string,
): Promise<string | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("budgets")
    .select("month_key, total_salary, savings_goal, categories")
    .eq("user_id", userId)
    .order("month_key", { ascending: false });

  if (error || !data?.length) {
    return null;
  }

  for (const row of data) {
    const budget = await mapBudgetRow(row as BudgetRow, row.month_key);
    if (isMeaningfulBudget(budget)) {
      return row.month_key;
    }
  }

  return data[0]?.month_key ?? null;
}

/** Month to open when the URL has no ?month= — prefers current month if it has data. */
export async function resolveDefaultMonthKeyForUser(): Promise<string> {
  const current = resolveMonthKey(undefined);
  const user = await getSessionUser();

  if (!user) {
    return current;
  }

  const currentBudget = await getBudget(current);
  if (currentBudget && isMeaningfulBudget(currentBudget)) {
    return current;
  }

  const currentExpenses = await getExpensesForMonth(current);
  if (currentExpenses.length > 0) {
    return current;
  }

  const recentMonth = await getMostRecentBudgetMonthKey(user.id);
  return recentMonth ?? current;
}

export async function listCustomCategories(): Promise<CustomCategoryRecord[]> {
  const user = await getSessionUser();
  if (!user) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("custom_categories")
    .select("id, group_label, leaf_name, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    if (isCustomCategoriesTableMissing(error)) {
      return [];
    }

    console.error("Error listing custom categories:", error);
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapCustomCategoryRow(row));
}

/** @deprecated Use listCustomCategories */
export const listUserCustomCategories = listCustomCategories;

async function migrateCategoryNameAcrossApp(
  oldName: string,
  newName: string,
): Promise<void> {
  const supabase = await createClient();

  const { error: expenseError } = await supabase
    .from("expenses")
    .update({ category: newName })
    .eq("category", oldName);

  if (expenseError) {
    throw new Error(expenseError.message);
  }

  const { data: budgets, error: budgetFetchError } = await supabase
    .from("budgets")
    .select("id, categories");

  if (budgetFetchError) {
    throw new Error(budgetFetchError.message);
  }

  for (const budget of budgets ?? []) {
    const categories = Array.isArray(budget.categories)
      ? (budget.categories as BudgetCategory[])
      : [];

    if (!categories.some((category) => category.name === oldName)) {
      continue;
    }

    const updated = categories.map((category) =>
      category.name === oldName ? { ...category, name: newName } : category,
    );

    const { error: budgetUpdateError } = await supabase
      .from("budgets")
      .update({ categories: updated, updated_at: new Date().toISOString() })
      .eq("id", budget.id);

    if (budgetUpdateError) {
      throw new Error(budgetUpdateError.message);
    }
  }
}

async function revalidateCustomCategories(): Promise<void> {
  await revalidateAppData();
  revalidateTag(GLOBAL_CUSTOM_CATEGORIES_TAG, "max");
}

export async function addCustomCategory(
  groupLabel: string | undefined,
  leafName: string,
): Promise<CustomCategoryRecord> {
  await requireSuperAdminForCategoryManagement();

  const existing = await listCustomCategories();
  const validation = validateCustomCategoryInput(groupLabel, leafName, {
    existingCustomFullNames: existing.map((category) => category.fullName),
  });

  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const user = await getSessionUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("custom_categories")
    .insert({
      group_label: validation.groupLabel,
      leaf_name: validation.leafName,
      created_by: user?.id ?? null,
    })
    .select("id, group_label, leaf_name, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("That category already exists.");
    }

    throw new Error(error.message);
  }

  await revalidateCustomCategories();
  return mapCustomCategoryRow(data);
}

export async function updateCustomCategory(
  id: string,
  groupLabel: string | undefined,
  leafName: string,
): Promise<CustomCategoryRecord> {
  await requireSuperAdminForCategoryManagement();

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("custom_categories")
    .select("id, group_label, leaf_name, created_at")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!existing) {
    throw new Error("Category not found.");
  }

  const current = mapCustomCategoryRow(existing);
  const allCustom = await listCustomCategories();
  const validation = validateCustomCategoryInput(groupLabel, leafName, {
    existingCustomFullNames: allCustom.map((category) => category.fullName),
    excludeFullName: current.fullName,
  });

  if (!validation.ok) {
    throw new Error(validation.error);
  }

  if (validation.fullName !== current.fullName) {
    await migrateCategoryNameAcrossApp(current.fullName, validation.fullName);
  }

  const { data, error } = await supabase
    .from("custom_categories")
    .update({
      group_label: validation.groupLabel,
      leaf_name: validation.leafName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, group_label, leaf_name, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("That category already exists.");
    }

    throw new Error(error.message);
  }

  await revalidateCustomCategories();
  return mapCustomCategoryRow(data);
}

export async function deleteCustomCategory(id: string): Promise<void> {
  await requireSuperAdminForCategoryManagement();

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("custom_categories")
    .select("id, group_label, leaf_name, created_at")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!existing) {
    throw new Error("Category not found.");
  }

  const fullName = mapCustomCategoryRow(existing).fullName;
  const { count, error: countError } = await supabase
    .from("expenses")
    .select("id", { count: "exact", head: true })
    .eq("category", fullName);

  if (countError) {
    throw new Error(countError.message);
  }

  if ((count ?? 0) > 0) {
    throw new Error(
      "This category has expenses logged. Reassign or delete them first.",
    );
  }

  const { error } = await supabase.from("custom_categories").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  await revalidateCustomCategories();
}

/** @deprecated Use addCustomCategory */
export const addUserCustomCategory = addCustomCategory;

/** @deprecated Use deleteCustomCategory */
export const deleteUserCustomCategory = deleteCustomCategory;
