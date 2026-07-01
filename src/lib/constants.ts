import type { BudgetCategory } from "@/lib/types";

export const DEFAULT_CATEGORIES: BudgetCategory[] = [
  { name: "Kids", allocated: 0 },
  { name: "Wife & Family", allocated: 0 },
  { name: "Groceries", allocated: 0 },
  { name: "Food", allocated: 0 },
  { name: "Home & Bills", allocated: 0 },
  { name: "Utilities", allocated: 0 },
  { name: "Fuel", allocated: 0 },
  { name: "Transport", allocated: 0 },
  { name: "Shopping", allocated: 0 },
  { name: "Personal", allocated: 0 },
  { name: "Entertainment", allocated: 0 },
  { name: "Other", allocated: 0 },
];

export const CATEGORY_HINTS: Record<string, string> = {
  Kids: "Pampers, milk, formula, baby care",
  "Wife & Family": "Wife's needs, family gifts",
  Groceries: "Rashan, home kitchen stock",
  Food: "Meals, takeout, tea outside home",
  "Home & Bills": "Rent, maintenance, furniture",
  Utilities: "Electricity, gas, water, internet",
  Fuel: "Petrol for car or bike",
  Transport: "Ride-hailing, bus, parking",
  Shopping: "Clothes, electronics, general buys",
  Personal: "Your haircut, gym, hobbies",
  Entertainment: "Movies, streaming, leisure",
  Other: "Anything that does not fit above",
};

export const CATEGORY_BUDGET_WEIGHTS: Record<string, number> = {
  Kids: 0.14,
  "Wife & Family": 0.06,
  Groceries: 0.16,
  Food: 0.08,
  "Home & Bills": 0.18,
  Utilities: 0.08,
  Fuel: 0.06,
  Transport: 0.04,
  Shopping: 0.06,
  Personal: 0.05,
  Entertainment: 0.04,
  Other: 0.05,
};

export function mergeWithDefaultCategories(
  stored: BudgetCategory[] | null | undefined,
): BudgetCategory[] {
  const storedMap = new Map(
    (Array.isArray(stored) ? stored : []).map((category) => [
      category.name,
      category.allocated,
    ]),
  );

  return DEFAULT_CATEGORIES.map((category) => ({
    name: category.name,
    allocated: storedMap.get(category.name) ?? 0,
  }));
}

export function distributeCategoryBudgets(
  categories: BudgetCategory[],
  spendable: number,
): BudgetCategory[] {
  if (spendable <= 0 || categories.length === 0) {
    return categories;
  }

  return categories.map((category) => ({
    ...category,
    allocated: Math.round(
      spendable * (CATEGORY_BUDGET_WEIGHTS[category.name] ?? 0.05),
    ),
  }));
}
