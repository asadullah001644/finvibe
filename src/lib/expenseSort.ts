interface SortableExpense {
  date: Date | string;
  createdAt?: Date | string;
}

function normalizeExpenseDate(date: Date | string): Date {
  return date instanceof Date ? date : new Date(date);
}

function normalizeExpenseTimestamp(date: Date | string | undefined): number {
  if (!date) {
    return 0;
  }

  const parsed = normalizeExpenseDate(date);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

export function compareExpensesByRecency(
  left: SortableExpense,
  right: SortableExpense,
): number {
  const dateDiff =
    normalizeExpenseTimestamp(right.date) - normalizeExpenseTimestamp(left.date);

  if (dateDiff !== 0) {
    return dateDiff;
  }

  return (
    normalizeExpenseTimestamp(right.createdAt) -
    normalizeExpenseTimestamp(left.createdAt)
  );
}
