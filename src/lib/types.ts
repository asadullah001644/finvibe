export interface BudgetCategory {
  name: string;
  allocated: number;
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
}
