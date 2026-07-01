export interface BudgetMetrics {
  salary: number;
  savingsGoal: number;
  spendLimit: number;
  totalSpent: number;
  spendableRemaining: number;
  accountBalance: number;
}

export function computeBudgetMetrics(
  salary: number,
  savingsGoal: number,
  totalSpent: number,
): BudgetMetrics {
  const spendLimit = Math.max(salary - savingsGoal, 0);

  return {
    salary,
    savingsGoal,
    spendLimit,
    totalSpent,
    spendableRemaining: spendLimit - totalSpent,
    accountBalance: salary - totalSpent,
  };
}
