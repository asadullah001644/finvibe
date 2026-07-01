"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { resolvePinHash } from "@/lib/pinHash";

const SESSION_COOKIE = "finvibe_session";
const SESSION_VALUE = "unlocked";
const SESSION_MAX_AGE = 60 * 60 * 24;

const AUDIT_SYSTEM_INSTRUCTION = `You are a high-end, uncompromising financial systems analyst embedded in a personal capital tracking app.
Analyze the user's salary, savings goal, category budgets, and spending totals. Deliver a ruthless yet actionable markdown audit of their trajectory.
Highlight the main leakage vectors and prescribe exactly 3 execution rules to recover the savings goal before month's end.
Keep it highly concise. Format the entire response in clean Markdown with headings and bullet points.`;

async function hasUnlockedSession(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value === SESSION_VALUE;
}

export async function verifyPin(inputPin: string): Promise<boolean> {
  const { hash: hashedPin, error } = resolvePinHash();

  if (!hashedPin) {
    if (error === "invalid") {
      throw new Error(
        "PIN hash misconfigured on server. On Vercel use APP_SECRET_PIN_HASH_B64 (recommended) or paste the raw bcrypt hash without backslash escapes, then redeploy.",
      );
    }

    throw new Error(
      "PIN hash not configured on server. Add APP_SECRET_PIN_HASH or APP_SECRET_PIN_HASH_B64 in Vercel → Settings → Environment Variables (Production), then redeploy.",
    );
  }

  const isMatch = await bcrypt.compare(inputPin, hashedPin);

  if (!isMatch) {
    return false;
  }

  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  redirect("/");
}

export async function lockSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

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

export async function runFinancialAudit(
  expenses: unknown[],
  budget: unknown,
): Promise<string> {
  if (!(await hasUnlockedSession())) {
    throw new Error("Unauthorized session.");
  }

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
