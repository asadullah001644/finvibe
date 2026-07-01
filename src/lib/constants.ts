import type { BudgetCategory } from "@/lib/types";

export const DEFAULT_CATEGORIES: BudgetCategory[] = [
  { name: "Food", allocated: 0 },
  { name: "Utilities", allocated: 0 },
  { name: "Fuel", allocated: 0 },
  { name: "Shopping", allocated: 0 },
  { name: "Entertainment", allocated: 0 },
  { name: "Other", allocated: 0 },
];
