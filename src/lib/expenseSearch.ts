import { getChildCategoryName } from "@/lib/constants";

export interface ExpenseSearchTarget {
  description: string;
  category: string;
}

export function normalizeExpenseSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function expenseMatchesSearch(
  expense: ExpenseSearchTarget,
  query: string,
): boolean {
  const normalizedQuery = normalizeExpenseSearchQuery(query);

  if (!normalizedQuery) {
    return true;
  }

  const description = expense.description.trim().toLowerCase();
  const category = expense.category.toLowerCase();
  const childCategory = getChildCategoryName(expense.category).toLowerCase();

  return (
    description.includes(normalizedQuery) ||
    category.includes(normalizedQuery) ||
    childCategory.includes(normalizedQuery)
  );
}

export function filterExpensesBySearch<T extends ExpenseSearchTarget>(
  expenses: T[],
  query: string,
): T[] {
  const normalizedQuery = normalizeExpenseSearchQuery(query);

  if (!normalizedQuery) {
    return expenses;
  }

  return expenses.filter((expense) => expenseMatchesSearch(expense, query));
}
