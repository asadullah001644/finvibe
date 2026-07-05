export interface BudgetCategory {
  name: string;
  allocated: number;
}

export interface CategoryGroup {
  label: string | null;
  items: string[];
}

export interface Budget {
  monthKey: string;
  totalSalary: number;
  savingsGoal: number;
  categories: BudgetCategory[];
}

export interface Expense {
  id?: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
}

export interface SerializedExpense {
  _id?: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  createdAt?: Date;
}

export interface RecurringExpense {
  id: string;
  amount: number;
  category: string;
  description: string;
  isActive: boolean;
}

export type UserRole = "user" | "super_admin";

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  isDisabled: boolean;
  appPinHash: string | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
}
