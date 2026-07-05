"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireAuth, requireSuperAdmin } from "@/lib/auth";
import { isProfilesTableMissing } from "@/lib/schema";
import { createClient } from "@/utils/supabase/server";
import { clearPinSession, setPinSession } from "@/lib/pinSession";

const AUDIT_SYSTEM_INSTRUCTION = `You are a high-end, uncompromising financial systems analyst embedded in a personal capital tracking app.
Analyze the user's salary, savings goal, category budgets, and spending totals. Deliver a ruthless yet actionable markdown audit of their trajectory.
Highlight the main leakage vectors and prescribe exactly 3 execution rules to recover the savings goal before month's end.
Keep it highly concise. Format the entire response in clean Markdown with headings and bullet points.`;

function buildAuditPrompt(expenses: unknown[], budget: unknown): string {
  const budgetRecord =
    budget && typeof budget === "object"
      ? (budget as Record<string, unknown>)
      : {};

  const totalSalary = Number(budgetRecord.totalSalary ?? budgetRecord.total_salary ?? 0);
  const savingsGoal = Number(budgetRecord.savingsGoal ?? budgetRecord.savings_goal ?? 0);
  const categories = Array.isArray(budgetRecord.categories)
    ? budgetRecord.categories
    : [];

  const normalizedExpenses = (Array.isArray(expenses) ? expenses : []).map(
    (expense) => {
      const row =
        expense && typeof expense === "object"
          ? (expense as Record<string, unknown>)
          : {};

      return {
        amount: Number(row.amount ?? 0),
        category: String(row.category ?? "General"),
      };
    },
  );

  const totalSpent = normalizedExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );

  const categoryTotals = normalizedExpenses.reduce<Record<string, number>>(
    (accumulator, expense) => {
      accumulator[expense.category] =
        (accumulator[expense.category] ?? 0) + expense.amount;
      return accumulator;
    },
    {},
  );

  const categoryBudgets = (
    categories as Array<{ name?: string; allocated?: number }>
  ).map((category) => {
    const name = String(category.name ?? "General");
    const allocated = Number(category.allocated ?? 0);
    const spent = categoryTotals[name] ?? 0;
    const percentUsed =
      allocated > 0 ? Math.round((spent / allocated) * 100) : null;

    return {
      category: name,
      allocated,
      spent,
      percentUsed,
      overBudget: allocated > 0 && spent > allocated,
    };
  });

  const projectedSavings = totalSalary - totalSpent;
  const onTrack = projectedSavings >= savingsGoal;
  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate();

  return [
    "Context for capital audit:",
    "",
    `Total Salary: ${totalSalary}`,
    `Savings Goal: ${savingsGoal}`,
    `Today is Day ${dayOfMonth} of ${daysInMonth}`,
    `Total Spent To Date: ${totalSpent}`,
    `Projected Savings If Pace Holds: ${projectedSavings}`,
    `On Track For Savings Goal: ${onTrack ? "Yes" : "No"}`,
    "",
    "Category Budget vs Spend:",
    JSON.stringify(categoryBudgets, null, 2),
  ].join("\n");
}

export async function verifyPin(inputPin: string): Promise<boolean> {
  const { user, profile } = await requireAuth();

  if (!profile.appPinHash) {
    throw new Error("App PIN is not enabled. Enable it in Settings first.");
  }

  const isMatch = await bcrypt.compare(inputPin, profile.appPinHash);
  if (!isMatch) {
    return false;
  }

  await setPinSession(user.id);
  revalidatePath("/", "layout");
  return true;
}

export async function lockSession(): Promise<void> {
  await clearPinSession();
  revalidatePath("/", "layout");
}

export async function setAppPinAction(pin: string): Promise<{ success: boolean; error?: string }> {
  const { user, profile } = await requireAuth();

  if (!/^\d{4}$/.test(pin)) {
    return { success: false, error: "PIN must be exactly 4 digits." };
  }

  const hash = await bcrypt.hash(pin, 10);
  const supabase = await createClient();
  const role = profile.role;
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? profile.email,
      role,
      app_pin_hash: hash,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    if (isProfilesTableMissing(error)) {
      return {
        success: false,
        error:
          "Profiles table not ready. Run supabase/migrations/003_multi_user_foundation.sql first.",
      };
    }
    return { success: false, error: error.message };
  }

  await setPinSession(user.id);
  revalidatePath("/", "layout");
  return { success: true };
}

export async function clearAppPinAction(): Promise<{ success: boolean; error?: string }> {
  const { user, profile } = await requireAuth();
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? profile.email,
      role: profile.role,
      app_pin_hash: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (error) {
    if (isProfilesTableMissing(error)) {
      return {
        success: false,
        error:
          "Profiles table not ready. Run supabase/migrations/003_multi_user_foundation.sql first.",
      };
    }
    return { success: false, error: error.message };
  }

  await clearPinSession();
  revalidatePath("/", "layout");
  return { success: true };
}

export async function runFinancialAudit(
  expenses: unknown[],
  budget: unknown,
): Promise<string> {
  await requireSuperAdmin();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY environment variable.");
  }

  const prompt = buildAuditPrompt(expenses, budget);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: AUDIT_SYSTEM_INSTRUCTION,
  });

  const result = await model.generateContent(prompt);
  const analysis = result.response.text().trim();

  if (!analysis) {
    throw new Error("Gemini returned an empty analysis.");
  }

  return analysis;
}
